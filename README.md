# Business OS

A premium, dark workspace for freelancers, creators, consultants, and small businesses. This product intentionally contains **no AI features** and uses **one-time payment only** (no recurring customer subscriptions).

## Product modules

- Overview dashboard with client value, pipeline, tasks, and offer summaries
- Contacts CRM with lead / qualified / client stages
- Task list with priorities and completion tracking
- Offer catalog for services and packages
- Search, JSON workspace export, responsive navigation
- Public landing page with feature overview, one-time pricing, and FAQs
- Supabase email/password sign-up and sign-in, password-reset request, and password recovery
- Customer-facing privacy, terms, and refund-information draft pages (not finalized legal policies)
- Supabase email/password authentication
- Per-user Supabase cloud persistence for contacts, tasks, and offers
- Stripe Checkout Edge Function for a one-time lifetime purchase with a server-side Stripe Price validation check
- Authenticated account deletion endpoint; workspace and entitlements cascade while the minimum purchase ledger is retained without its account link
- Signature-verified Stripe webhook for payment confirmation, refunds, disputes, and entitlement records

## Local development

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local
npm run dev
npm run build
```

Set only the browser-safe Supabase project URL and anon/publishable key in `.env.local`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never put a Supabase service-role key, Stripe secret key, or Stripe webhook signing secret in a `VITE_*` variable, frontend file, GitHub Pages artifact, or committed environment file.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Configure Supabase Auth site URL and redirect allowlist for the final production origin and local development origin.
4. Configure email confirmation and password reset behavior.
5. Add GitHub Actions repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the Pages build.
6. Deploy the Edge Functions described below.
7. Test two separate accounts and verify each account can only read/write its own contacts, tasks, and offers.

After sign-in, the app loads that user's cloud rows and syncs changes to Supabase. Signed-out/demo mode uses local browser storage. Cloud sync requires the schema to be installed and Supabase variables to be configured. Workspace JSON export is available. Signed-in users can request permanent account deletion from Settings; the server verifies the session, removes workspace and entitlement records, and unlinks the minimal purchase ledger for accounting/dispute retention. Deploy the `delete-account` function before enabling that control.

## Stripe one-time checkout setup

This repository contains three Supabase Edge Functions:

- `create-checkout`: requires a valid Supabase user session, then creates a Stripe Checkout Session in `payment` mode for the configured Stripe Price ID.
- `stripe-webhook`: validates Stripe's timestamped HMAC signature and only creates an entitlement after Stripe reports a paid Checkout Session. It also revokes access on refunds and disputes and restores access when a dispute is won.
- `delete-account`: verifies the signed-in user, unlinks the minimal purchase ledger for accounting/dispute retention, and permanently deletes the account, workspace records, and entitlements.

**Launch pricing:** $59 USD one-time for the introductory launch offer. Set the Stripe Price to exactly USD 59.00 and use its Price ID. After the introductory offer ends, create a separate USD 79.00 one-time Price and update `STRIPE_PRICE_ID_BUSINESS_OS` to move to the standard price. Never change the price amount in the frontend; Stripe is the source of truth. Add these Edge Function secrets in Supabase (not GitHub Pages variables):

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_BUSINESS_OS` — the Stripe Price ID for the **$59 USD introductory one-time lifetime purchase** (create this as a one-time price, not a recurring price)
- `BUSINESS_OS_EXPECTED_PRICE_CENTS=5900` — server-side guard that rejects an inactive, recurring, non-USD, or wrong-amount Stripe Price. For the planned $79 standard offer, update both the Stripe Price ID and this value to `7900`.
- `STRIPE_WEBHOOK_SECRET` — signing secret for the deployed webhook endpoint
- `APP_ORIGIN` — full production app URL, including the GitHub Pages project path when applicable (for example, `https://OWNER.github.io/abiba` or `https://your-domain.example`). CORS compares only its origin; Stripe redirects retain its path.
- Supabase-provided `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`

Deploy:

```bash
supabase functions deploy create-checkout --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy delete-account --no-verify-jwt
supabase secrets set STRIPE_SECRET_KEY=... STRIPE_PRICE_ID_BUSINESS_OS=... STRIPE_WEBHOOK_SECRET=... APP_ORIGIN=...
```

In Stripe Dashboard, add a webhook endpoint pointing to:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

Subscribe at minimum to:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`
- `charge.dispute.created`
- `charge.dispute.closed`

Set the generated endpoint signing secret as `STRIPE_WEBHOOK_SECRET`. Configure `APP_ORIGIN` for the public site URL. The `delete-account` function uses the same `APP_ORIGIN` and Supabase service-role secret. Use Stripe test mode first. Verify successful payments, abandoned checkout, duplicate webhook delivery, refunds, disputes, and failed payments before enabling live mode.

**Important release limitation:** the customer purchase gate and secure server-side checkout/webhook code are now in the repository. They are not yet live: Supabase and Stripe credentials, a real one-time Price ID, deployed Edge Functions, a configured webhook endpoint, and end-to-end test purchases are still required. The product also still needs customer-facing billing/support workflows and reviewed legal policies. Do not advertise checkout as active or accept live payments until the complete flow is configured and verified. A success URL is never proof of payment.

## GitHub Pages

1. In repository Settings → Pages, choose **GitHub Actions** as the source.
2. The deployment workflow publishes the `main` branch to `https://OWNER.github.io/abiba/`.
3. Add the two browser-safe Supabase Actions variables before deploying.
4. For a custom domain, configure the domain in GitHub Pages and adjust `base` in `vite.config.ts`.

## Customer-facing policy drafts\n\nThe public portal includes privacy, terms, and refund-information pages to make the required disclosures visible during development. They are intentionally labeled as drafts and must not be treated as finalized legal policies. The operator must supply its legal business identity, support contact, governing jurisdiction, actual retention/processor details, refund window, and other business-specific terms and obtain appropriate review before accepting payments.\n\n## Customer-facing policy drafts

The public portal includes privacy, terms, and refund-information pages to make required disclosures visible during development. They are intentionally labeled as drafts and must not be treated as finalized legal policies. The operator must supply its legal business identity, support contact, governing jurisdiction, actual retention and processor details, refund window, and other business-specific terms and obtain appropriate review before accepting payments.

## Security and commercial launch checklist

- [ ] Configure production Supabase Auth URLs and email delivery.
- [ ] Apply the SQL schema and validate RLS using separate test accounts.
- [ ] Configure the one-time Stripe Price and Supabase Edge Function secrets.
- [ ] Add and test the Stripe webhook endpoint in test mode.
- [x] Add purchase CTA and enforce access using server-verified entitlements in the application code.
- [ ] Verify the entitlement gate and payment lifecycle end to end in Stripe test mode.
- [x] Add password recovery, workspace JSON export, and authenticated account deletion code.\n- [ ] Deploy and test the account deletion Edge Function.\n- [ ] Establish a monitored support contact and complete privacy-request handling.
- [ ] Replace the in-app policy drafts with reviewed Privacy Policy, Terms, Refund Policy, and verified operator/contact details.
- [ ] Add automated unit, integration, and end-to-end tests.
- [ ] Run dependency/security checks and accessibility review.
- [ ] Verify GitHub Actions CI and Pages deployment on the production branch.
- [ ] Complete test purchases and refund/dispute scenarios before live launch.

This is an actively developed release candidate, not a certification of legal compliance, security, or production readiness. Do not promise a particular business outcome or revenue level.
