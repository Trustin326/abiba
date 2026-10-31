// Supabase Edge Function: create-checkout
// Required secrets: SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE_SECRET_KEY,
// STRIPE_PRICE_ID_BUSINESS_OS, BUSINESS_OS_EXPECTED_PRICE_CENTS, APP_ORIGIN
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const configuredAppUrl = Deno.env.get("APP_ORIGIN") ?? "";
const allowedOrigin = configuredAppUrl ? new URL(configuredAppUrl).origin : "";
const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });

  const origin = req.headers.get("origin");
  if (!allowedOrigin || origin !== allowedOrigin) return Response.json({ error: "Origin not allowed" }, { status: 403, headers: cors });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return Response.json({ error: "Sign in is required" }, { status: 401, headers: cors });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const priceId = Deno.env.get("STRIPE_PRICE_ID_BUSINESS_OS");
  const expectedPriceCents = Number(Deno.env.get("BUSINESS_OS_EXPECTED_PRICE_CENTS") ?? "5900");
  if (!supabaseUrl || !anonKey || !stripeKey || !priceId || !Number.isInteger(expectedPriceCents) || expectedPriceCents <= 0) {
    return Response.json({ error: "Payment service is not configured" }, { status: 503, headers: cors });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return Response.json({ error: "Invalid session" }, { status: 401, headers: cors });

  const { data: existingEntitlement, error: entitlementLookupError } = await supabase
    .from("entitlements").select("status")
    .eq("user_id", user.id).eq("product_key", "business_os_lifetime").maybeSingle();
  if (entitlementLookupError) return Response.json({ error: "Could not verify existing access" }, { status: 503, headers: cors });
  if (existingEntitlement?.status === "active") return Response.json({ error: "This account already has lifetime access" }, { status: 409, headers: cors });

  // Verify the configured Stripe Price matches the amount shown in the public offer.
  // This prevents an accidental wrong Price ID or recurring price from being charged.
  const priceResponse = await fetch("https://api.stripe.com/v1/prices/" + encodeURIComponent(priceId), {
    headers: { Authorization: "Bearer " + stripeKey },
  });
  const configuredPrice = await priceResponse.json();
  if (!priceResponse.ok || !configuredPrice.active || configuredPrice.type !== "one_time" ||
      configuredPrice.currency !== "usd" || configuredPrice.unit_amount !== expectedPriceCents) {
    console.error("Stripe Price configuration does not match expected one-time USD price");
    return Response.json({ error: "The checkout price is not configured correctly. Please contact support." }, { status: 503, headers: cors });
  }

  const appUrl = configuredAppUrl.replace(/\/$/, "");
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: appUrl + "/?checkout=success&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: appUrl + "/?checkout=cancelled",
    client_reference_id: user.id,
    "metadata[user_id]": user.id,
    "metadata[product_key]": "business_os_lifetime",
    "payment_intent_data[metadata][user_id]": user.id,
    "payment_intent_data[metadata][product_key]": "business_os_lifetime",
    customer_email: user.email ?? "",
  });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: "Bearer " + stripeKey, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const session = await response.json();
  if (!response.ok || !session.url) {
    console.error("Stripe checkout creation failed", response.status, session?.error?.type);
    return Response.json({ error: "Could not start checkout. Please try again." }, { status: 502, headers: cors });
  }
  return Response.json({ url: session.url }, { headers: cors });
});
