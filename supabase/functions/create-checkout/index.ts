// Supabase Edge Function: create-checkout
// Required secrets: SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE_SECRET_KEY,
// STRIPE_PRICE_ID_BUSINESS_OS, APP_ORIGIN
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });

  const origin = req.headers.get("origin");
  const allowedOrigin = Deno.env.get("APP_ORIGIN");
  if (!allowedOrigin || origin !== allowedOrigin) return Response.json({ error: "Origin not allowed" }, { status: 403, headers: cors });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return Response.json({ error: "Sign in is required" }, { status: 401, headers: cors });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const priceId = Deno.env.get("STRIPE_PRICE_ID_BUSINESS_OS");
  if (!supabaseUrl || !anonKey || !stripeKey || !priceId) {
    return Response.json({ error: "Payment service is not configured" }, { status: 503, headers: cors });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return Response.json({ error: "Invalid session" }, { status: 401, headers: cors });

  const appOrigin = allowedOrigin.replace(/\/$/, "");
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: appOrigin + "/?checkout=success&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: appOrigin + "/?checkout=cancelled",
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
