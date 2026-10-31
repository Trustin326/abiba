# Supabase Edge Function secrets

Set these in the Supabase project, never in frontend env files:

- STRIPE_SECRET_KEY
- STRIPE_PRICE_ID_BUSINESS_OS (a one-time Stripe Price ID)
- STRIPE_WEBHOOK_SECRET
- APP_ORIGIN (exact deployed app origin)

Supabase also supplies SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to Edge Functions. Keep the service role key server-side only.

Deploy both functions with the Supabase CLI. The checkout function validates the caller's Supabase session itself; the webhook validates Stripe's signature itself, so the functions are configured with platform JWT verification disabled.
