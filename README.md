# Business OS

A focused business workspace for freelancers, creators, consultants, and small teams. Business OS intentionally has **no AI features** and uses a **one-time purchase model** rather than recurring customer subscriptions.

## Included product

- Overview dashboard: client value, sales pipeline, open tasks, completed work, and offers
- Contacts CRM: contact records, lead / qualified / client stages, opportunity values, search, and deletion
- Task manager: due windows, priorities, completion tracking, and deletion
- Offer catalog: service/package records, prices, draft/ready status, and deletion
- Responsive premium dark interface and public product landing page
- Introductory price display: USD $59 one-time; planned standard price USD $79 one-time
- Supabase email/password sign-up and sign-in, password reset, and password recovery
- Per-user cloud persistence with row-level security
- JSON export of workspace records
- Authenticated account deletion endpoint
- Stripe one-time Checkout creation, server-side price validation, signed webhook verification, and purchase entitlements
- Customer-facing privacy, terms, and refund-information pages clearly marked as drafts

## Local development

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local
npm run dev
npm run test
npm run build
```

Browser-safe environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never expose Supabase service-role keys, Stripe secret keys, or webhook signing secrets in `VITE_*` variables, browser code, GitHub Pages artifacts, or committed files.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL Editor. The script includes the purchase-ledger migration needed for account deletion.
3. Configure Auth site URL and redirect allowlist for the production app URL and local development URL.
4. Configure email confirmation and password-reset delivery.
5. Add GitHub Actions repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. Deploy the Edge Functions listed below and configure their secrets.
7. Test with at least two accounts. Confirm that each account can only access its own contacts, tasks, and offers.

When authenticated, the app loads that user's cloud records and syncs changes to Supabase. Signed-out demo mode uses local browser storage. Do not use demo-mode records as customer data.

## One-time Stripe setup

The app uses Stripe Checkout in `payment` mode. It does not create a recurring subscription.

**Introductory offer:** USD $59 one-time lifetime purchase. The planned standard price is USD $79. The Stripe Price ID and expected amount must match the price shown in the product.

Required Supabase Edge Function secrets:
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_BUSINESS_OS`: Stripe Price ID for an active, one-time USD $59 price
- `BUSINESS_OS_EXPECTED_PRICE_CENTS=5900`: server-side guard that rejects inactive, recurring, non-USD, or wrong-amount prices. For the planned $79 standard price, update both the Stripe Price ID and this value to `7900`.
- `STRIPE_WEBHOOK_SECRET`
- `APP_ORIGIN`: full public app URL, including the project path when using GitHub Pages (for example, `https://OWNER.github.io/abiba`)
- Supabase-provided `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`

Deploy the three functions:

```bash
supabase functions deploy create-checkout --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy delete-account --no-verify-jwt
supabase secrets set STRIPE_SECRET_KEY=... STRIPE_PRICE_ID_BUSINESS_OS=... BUSINESS_OS_EXPECTED_PRICE_CENTS=5900 STRIPE_WEBHOOK_SECRET=... APP_ORIGIN=...
```

Configure a Stripe webhook endpoint at:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

Subscribe to:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`
- `charge.dispute.created`
- `charge.dispute.closed`

Test successful payments, abandoned checkout, duplicate event delivery, refunds, disputes, and failed payments in Stripe test mode before enabling live payments. A return URL is never proof of payment; the verified webhook is the source of entitlement changes.

## Account deletion and data

Customers can export workspace records as JSON. Signed-in customers can request permanent account deletion from Settings or the unpaid-access screen. The deletion function verifies the user's session, removes workspace and entitlement records, and unlinks the minimal purchase ledger from the account so accounting/dispute records can be retained. Deploy and test this function before making the control available to customers.

## GitHub Pages

1. In repository Settings → Pages, select **GitHub Actions** as the source.
2. The deployment workflow publishes the `main` branch to `https://OWNER.github.io/abiba/`.
3. Add the two browser-safe Supabase Actions variables before deployment.
4. The Vite config already sets the `/abiba/` project base for the Pages build.

## Legal and customer support

The public portal contains privacy, terms, and refund-information **drafts** so the product's disclosures are visible during development. They are not final legal policies. Before accepting payments, the operator must supply and verify its legal business identity, customer support contact, governing jurisdiction, data-retention and processor details, refund window and process, acceptable-use rules, and other business-specific terms, then obtain appropriate review. A monitored customer-support route and privacy-request process must also be established.

## Release checklist

### Implemented in the repository
- [x] Public landing page, feature overview, pricing information, and FAQs
- [x] Sign-up, sign-in, password-reset request, and password recovery flows
- [x] Contacts, tasks, offers, search, export, and responsive dashboard
- [x] Per-user Supabase cloud persistence and RLS schema
- [x] One-time checkout function with server-side Stripe Price validation
- [x] Signed Stripe webhook and server-verified entitlement gate
- [x] Authenticated account deletion code and customer control
- [x] Customer-facing legal-information drafts
- [x] Unit tests for core dashboard metrics

### Still required before sales
- [ ] Apply the SQL schema and validate RLS with separate accounts
- [ ] Configure Supabase project, Auth URLs, and production email delivery
- [ ] Deploy all Edge Functions and configure server-only secrets
- [ ] Configure Stripe test Price and webhook; complete end-to-end payment tests
- [ ] Deploy and test account deletion
- [ ] Replace policy drafts with reviewed policies and verified operator/support details
- [ ] Expand unit coverage, add integration and end-to-end tests, and complete accessibility and security reviews
- [ ] Obtain a successful CI build and verify GitHub Pages deployment
- [ ] Complete refund and dispute scenario tests before live launch

This repository is an actively developed release candidate, not a certification of legal compliance, security, or production readiness. Do not accept live payments until the release checklist is complete.
