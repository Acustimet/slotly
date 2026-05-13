# Slotly Billing Setup

Two billing flows wired into the Cal.com substrate.

---

## Flow 1 — Stripe Connect (client pays pro at booking)

Cal.com has this built-in under `packages/app-store/stripepayment`.

### Setup (test mode)

1. Create a [Stripe account](https://stripe.com) (free).
2. Enable [Stripe Connect](https://dashboard.stripe.com/settings/connect) — choose **Standard** accounts.
3. Copy keys into `.env`:
   - `STRIPE_PRIVATE_KEY` = sk_test_...
   - `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` = pk_test_...
   - `STRIPE_CLIENT_ID` = ca_... (from Connect settings)
4. Register a webhook in Stripe dashboard → Webhooks:
   - URL: `https://your-domain.com/api/integrations/stripepayment/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the signing secret → `STRIPE_WEBHOOK_SECRET`
5. In the app: go to **Apps → Stripe** → connect your Stripe account.
6. On any event type, enable **Payment** and set a price.
7. Test: book the event using Stripe test card `4242 4242 4242 4242`.

### How it works

- Slotly acts as the Connect **platform**.
- Each pro connects their own Stripe account via OAuth.
- At booking, the client's card is charged → funds deposited to the pro's Stripe account.
- Slotly can optionally take a platform fee (set `STRIPE_PLATFORM_FEE_PERCENT` if desired).

### Switch to live

- Flip `STRIPE_PRIVATE_KEY` / `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` to live keys.
- Re-register the webhook with live keys.

---

## Flow 2 — Lemon Squeezy (pro pays Slotly $9/mo)

Lemon Squeezy handles VAT automatically — ideal for EU founders.

### Setup (test mode)

1. Create a [Lemon Squeezy account](https://app.lemonsqueezy.com) (free).
2. Create a **Store** → note the Store ID.
3. Create a **Product**:
   - Type: Subscription
   - Name: "Slotly Pro"
   - Add a variant: $9/month
   - Note the Product ID and Variant ID.
4. Create a **Webhook** at Settings → Webhooks:
   - URL: `https://your-domain.com/api/lemonsqueezy/webhook`
   - Events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`
   - Copy the signing secret.
5. Copy all IDs into `.env` (see `.env.billing.example`).

### How it works

- Free plan: 1 event type, Slotly watermark on booking page, no payment collection.
- Pro plan ($9/mo): unlimited event types, no watermark, Stripe Connect payments enabled.
- Upgrade flow: user clicks "Upgrade" → hits `/api/lemonsqueezy/checkout` → redirected to LS checkout.
- After payment: Lemon Squeezy fires webhook → `/api/lemonsqueezy/webhook` updates `user.metadata.slotlyPlan = 'pro'` and sets `hideBranding = true`.

### Webhook handler

`apps/web/pages/api/lemonsqueezy/webhook.ts`

- Verifies HMAC-SHA256 signature.
- Maps events to plan status (active/on_trial → pro, everything else → free).
- Updates `user.metadata` + `user.hideBranding` in Prisma.

### Checkout redirect

`apps/web/pages/api/lemonsqueezy/checkout.ts`

- Auth-gated GET endpoint.
- Builds Lemon Squeezy checkout URL with prefilled email/name and `custom.user_id` for webhook matching.
- Redirects user to checkout.

### Switch to live

- No code change needed.
- In Lemon Squeezy: go to Store → toggle off Test Mode.
- Update webhook URL if it changed.

---

## Feature gating

Plan is stored in `user.metadata.slotlyPlan` (string: `'free' | 'pro'`).

Example check:
```ts
const metadata = user.metadata as { slotlyPlan?: string } | null;
const isPro = metadata?.slotlyPlan === 'pro';
```

Gates to implement:
- Event type creation: block creation of 2nd+ event type if free
- Watermark: show "Powered by Slotly" on booking page if `hideBranding === false`
- Payment collection: show/hide Stripe Connect app install if free

---

## AGPL compliance

Slotly is a hosted Cal.com fork (AGPL-3.0). Source disclosure obligation applies.
Compliance posture: link to `https://github.com/Acustimet/slotly` from the app footer.
This satisfies the AGPL network-use clause.
