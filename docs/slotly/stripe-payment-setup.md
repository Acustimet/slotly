# Feature 1: Payment-Required Bookings (Stripe Connect)

**Status:** Ready to enable — no custom code required, Cal.com has this built in.  
**Author:** SkunkCTO  

---

## What this gives coaches

- Clients must pay before a booking is confirmed — no more ghosted meetings.
- Host receives funds directly via Stripe Connect (Slotly is just the platform).
- "No-show fee" / card-hold option for no-payment events.

---

## How it works in Cal.com

Cal.com ships a full Stripe Connect integration under `packages/app-store/stripepayment`. Once the app is
installed and the host connects their Stripe account, they can toggle "Require payment" on any event type.

The toggle lives at: **Event Type → Apps tab → Stripe → Enable payment**.

---

## Setup (host side)

### Step 1: Stripe account

1. Go to [stripe.com](https://stripe.com) and create an account.
2. Enable **Connect** in Stripe Dashboard → Settings → Connect settings.
3. Note your **Publishable key**, **Secret key**, and **Client ID** (from Connect settings).

### Step 2: Environment variables

Add to your `.env` (or deployment environment):

```bash
STRIPE_PRIVATE_KEY=sk_live_...          # or sk_test_... for testing
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_... # or pk_test_...
STRIPE_CLIENT_ID=ca_...                 # from Stripe Connect settings
STRIPE_WEBHOOK_SECRET=whsec_...         # from Stripe Dashboard → Webhooks
```

### Step 3: Register the Stripe webhook

In Stripe Dashboard → Developers → Webhooks → Add endpoint:

- **URL:** `https://your-slotly-domain.com/api/integrations/stripepayment/webhook`
- **Events to listen to:**
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `checkout.session.completed`

Copy the signing secret → set `STRIPE_WEBHOOK_SECRET`.

### Step 4: Install the Stripe app in Slotly

1. Log in as a user.
2. Go to **Apps** (top nav) → search "Stripe".
3. Click **Connect** → Stripe OAuth flow → authorizes the coach's account.

### Step 5: Enable payment on an event type

1. Open any event type for editing.
2. Click the **Apps** tab.
3. Find **Stripe** → toggle **Require payment**.
4. Set the price and currency.
5. Choose payment option:
   - **Charge upfront** — client pays to confirm.
   - **Hold (no-show fee)** — card is held; charged only if client cancels late.
6. Save.

---

## Test mode walkthrough

Use `sk_test_...` and `pk_test_...` keys. Test with Stripe's card number `4242 4242 4242 4242`.

1. Book a paid event type as a client.
2. Enter test card on Stripe Checkout.
3. Booking confirms → host receives notification.
4. Check Stripe Dashboard → Payments for the charge.

---

## Positioning copy (for landing page / onboarding)

> **Get paid to show up.**  
> Require payment before a session is confirmed. No more no-shows. Connect your Stripe account in 60 seconds.

---

## Cal.com AGPL note

The `stripepayment` app is part of Cal.com and is covered by AGPL-3.0. Because Slotly offers this over a
network, source code must be available. The GitHub repo at `Acustimet/slotly` satisfies this obligation.

---

## Files involved (reference)

| File | Purpose |
|---|---|
| `packages/app-store/stripepayment/components/EventTypeAppSettingsInterface.tsx` | UI toggle in event type settings |
| `packages/app-store/stripepayment/lib/PaymentService.ts` | Core Stripe charge logic |
| `packages/app-store/stripepayment/api/paymentCallback.ts` | Post-payment booking confirmation |
| `apps/web/pages/api/integrations/stripepayment/webhook.ts` | Stripe webhook receiver |
