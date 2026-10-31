# Security notes
- Never commit .env files, service-role keys, Stripe secret keys, or webhook signing secrets.
- All Supabase tables exposed to the client require RLS and restrictive policies.
- Browser storage is not a secure server-side source of truth; never store payment state or secrets there.
- Never grant paid access from a success URL or client-side flag.
- Verify Stripe webhooks server-side and make entitlement writes idempotent.
- Configure auth redirects, email verification, password reset, account deletion, and abuse controls before onboarding customers.