import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ? new URL(Deno.env.get("APP_ORIGIN")!).origin : "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  const configuredOrigin = Deno.env.get("APP_ORIGIN") ? new URL(Deno.env.get("APP_ORIGIN")!).origin : "";
  if (!configuredOrigin || request.headers.get("origin") !== configuredOrigin) return Response.json({ error: "Origin not allowed" }, { status: 403, headers: corsHeaders });
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Sign in required" }, { status: 401, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return Response.json({ error: "Account deletion is not configured" }, { status: 503, headers: corsHeaders });

  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await caller.auth.getUser();
  if (authError || !user) return Response.json({ error: "Your session could not be verified" }, { status: 401, headers: corsHeaders });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  // Retain the minimal purchase ledger for accounting and dispute handling while
  // severing its link to the deleted account. User workspace and entitlements
  // are removed by the auth.users foreign-key cascades.
  const { error: ledgerError } = await admin.from("purchases").update({ user_id: null }).eq("user_id", user.id);
  if (ledgerError) return Response.json({ error: "We could not prepare your account records for deletion" }, { status: 500, headers: corsHeaders });
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return Response.json({ error: "The account could not be deleted. Please contact support." }, { status: 500, headers: corsHeaders });
  return Response.json({ deleted: true }, { headers: corsHeaders });
});
