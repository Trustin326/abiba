# Supabase Edge Function setup

Set these secrets in the Supabase project, never in frontend environment files:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_BUSINESS_OS` — active one-time Stripe Price ID
- `BUSINESS_OS_EXPECTED_PRICE_CENTS` — `5900` for the $59 introductory price or `7900` for the planned $79 standard price
- `STRIPE_WEBHOOK_SECRET`
- `APP_ORIGIN` — full deployed app URL, including `/abiba` when using the GitHub Pages project URL

Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Keep the service-role key server-side only.

Deploy:

```bash
supabase functions deploy create-checkout --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy delete-account --no-verify-jwt
```

Platform JWT verification is disabled because the checkout and account-deletion functions verify the caller's access token themselves, while the webhook verifies Stripe's timestamped HMAC signature itself. The checkout function also retrieves the configured Stripe Price and rejects inactive, recurring, non-USD, or incorrect-amount prices. The account-deletion function verifies the caller, unlinks the purchase ledger, and then deletes the account; workspace and entitlement rows are removed by foreign-key cascades.

Test all three functions in a non-production Supabase project before deployment to customers.
