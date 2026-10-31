// Supabase Edge Function: stripe-webhook
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const encoder = new TextEncoder();
const hex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
const constantTimeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
};
async function verifyStripeSignature(raw: string, header: string, secret: string) {
  const parts = header.split(",").map((p) => p.split("="));
  const timestamp = parts.find(([k]) => k === "t")?.[1];
  const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!timestamp || !/^\d+$/.test(timestamp) || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp + "." + raw)));
  const expected = hex(digest);
  return signatures.some((signature) => constantTimeEqual(signature, expected));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const signature = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!webhookSecret || !supabaseUrl || !serviceKey) return new Response("Webhook is not configured", { status: 503 });

  const raw = await req.text();
  if (!(await verifyStripeSignature(raw, signature, webhookSecret))) return new Response("Invalid signature", { status: 400 });

  let event: Record<string, any>;
  try { event = JSON.parse(raw); } catch { return new Response("Invalid JSON", { status: 400 }); }
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const object = event.data?.object ?? {};

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      if (object.payment_status !== "paid") return new Response("Payment not settled; no entitlement granted", { status: 200 });
      const userId = object.metadata?.user_id;
      const productKey = object.metadata?.product_key;
      if (!userId || productKey !== "business_os_lifetime" || object.mode !== "payment") {
        console.error("Checkout metadata validation failed", event.id);
        return new Response("Invalid checkout metadata", { status: 400 });
      }
      const { data: purchase, error: purchaseError } = await db.from("purchases").upsert({
        user_id: userId,
        product_key: productKey,
        stripe_checkout_session_id: object.id,
        stripe_payment_intent_id: typeof object.payment_intent === "string" ? object.payment_intent : null,
        status: "paid",
        amount_total: Number.isInteger(object.amount_total) ? object.amount_total : null,
        currency: object.currency ?? null,
        paid_at: new Date().toISOString(),
      }, { onConflict: "stripe_checkout_session_id" }).select("id").single();
      if (purchaseError || !purchase) throw purchaseError ?? new Error("Purchase was not saved");
      const { error: entitlementError } = await db.from("entitlements").upsert({
        user_id: userId,
        product_key: productKey,
        purchase_id: purchase.id,
        status: "active",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,product_key" });
      if (entitlementError) throw entitlementError;
    }

    if (event.type === "charge.refunded" || event.type === "charge.dispute.created" || event.type === "charge.dispute.closed") {
      const paymentIntent = typeof object.payment_intent === "string" ? object.payment_intent : null;
      if (paymentIntent) {
        const revoked = event.type === "charge.refunded" || (event.type === "charge.dispute.closed" && object.status !== "won") || event.type === "charge.dispute.created";
        const status = event.type === "charge.refunded" ? "refunded" : event.type === "charge.dispute.created" ? "disputed" : object.status === "won" ? "paid" : "disputed";
        const { data: purchase, error } = await db.from("purchases").update({ status }).eq("stripe_payment_intent_id", paymentIntent).select("id,user_id,product_key").maybeSingle();
        if (error) throw error;
        if (purchase && revoked) {
          const { error: entitlementError } = await db.from("entitlements").update({ status: "revoked", updated_at: new Date().toISOString() }).eq("user_id", purchase.user_id).eq("product_key", purchase.product_key);
          if (entitlementError) throw entitlementError;
        }
        if (purchase && event.type === "charge.dispute.closed" && object.status === "won") {
          const { error: entitlementError } = await db.from("entitlements").update({ status: "active", updated_at: new Date().toISOString() }).eq("user_id", purchase.user_id).eq("product_key", purchase.product_key);
          if (entitlementError) throw entitlementError;
        }
      }
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Webhook persistence failed", event.id, error);
    return new Response("Webhook processing failed; Stripe should retry", { status: 500 });
  }
});
