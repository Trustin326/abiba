# Business OS

Premium dark workspace for freelancers, creators, consultants, and small businesses. No AI features and no subscription billing.

## Included
- Responsive dashboard, contacts CRM, tasks, offer catalog, and settings
- Create contacts/tasks/offers, complete tasks, remove records, search, JSON export
- Local browser persistence and optional Supabase email/password authentication wiring
- Starter Supabase schema with per-user row-level security
- GitHub Pages deployment workflow

## Local development
Requires Node.js 20+. Run `npm install`, `npm run dev`, and `npm run build`.

## GitHub Pages
1. Repository Settings → Pages → set source to GitHub Actions.
2. Workflow deploys on pushes to main at `https://OWNER.github.io/abiba/`.
3. For a custom domain, adjust `base` in vite.config.ts.

## Supabase
1. Create a project and run `supabase/schema.sql` in the SQL Editor.
2. Configure Auth URL allowlists and email confirmation.
3. Add Actions variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` or use `.env.local` locally.
4. Never expose a service-role key in browser code or a `VITE_` variable.

**Important:** Supabase auth is wired, but contacts/tasks/offers currently persist in localStorage and are not synced to cloud tables. Do not use this as a multi-user cloud SaaS until cloud CRUD, loading/error states, account deletion, and cross-user isolation are implemented and tested.

## Stripe / one-time payments
No payment access is granted in this version. A Payment Link or success URL is not proof of payment. Before selling access, implement a server-side Stripe webhook (for example, a Supabase Edge Function), verify signatures, handle duplicate events idempotently, and store entitlements in a protected table. Keep Stripe secret and webhook signing keys in server-side secrets only.

## Launch status
This is a functional UI/MVP foundation, not yet a fully production-ready commercial SaaS. Before launch, finish cloud CRUD and account lifecycle, verified one-time checkout/entitlements and refunds, privacy/terms/refund pages, support contact, automated tests/accessibility checks, and verify deployment. No revenue outcome is guaranteed.