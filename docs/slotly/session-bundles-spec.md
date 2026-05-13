# Session Bundle / Package Bookings — Technical Spec

**Status:** Backend implemented (SON-14 stretch goal complete) — UI phase pending  
**Author:** SkunkCTO  
**Date:** 2026-05-13  

---

## Problem

Coaches and consultants sell sessions in blocks (5-session coaching pack, 10-session retainer) rather than
one-at-a-time. Calendly does not support this. Slotly can own this niche with a lightweight bundle system.

---

## User Story

> As a coach, I want to sell a 5-session pack upfront so I get paid in full, then let the client book each
> session by spending one credit from their pack — without me chasing invoices.

---

## Data Model

Add to the Prisma schema (new tables, no changes to existing Cal.com tables):

```prisma
model SessionBundle {
  id            String   @id @default(cuid())
  userId        String                          // coach who owns this product
  name          String                          // e.g. "5-Session Coaching Pack"
  sessionCount  Int                             // credits granted on purchase
  price         Int                             // in smallest currency unit (cents)
  currency      String   @default("usd")
  stripePriceId String?                         // pre-created Stripe Price object
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])
  purchases     BundlePurchase[]
}

model BundlePurchase {
  id              String   @id @default(cuid())
  bundleId        String
  attendeeEmail   String
  attendeeName    String
  creditsTotal    Int
  creditsUsed     Int      @default(0)
  stripeSessionId String?  @unique
  paidAt          DateTime?
  expiresAt       DateTime?
  createdAt       DateTime @default(now())
  bundle          SessionBundle @relation(fields: [bundleId], references: [id])
  bookings        BundleBookingUsage[]
}

model BundleBookingUsage {
  id         String   @id @default(cuid())
  purchaseId String
  bookingUid String                          // Cal.com booking UID
  usedAt     DateTime @default(now())
  purchase   BundlePurchase @relation(fields: [purchaseId], references: [id])
}
```

---

## API Routes

### POST `/api/slotly/bundles/checkout`
**Auth:** public (client-facing)  
**Body:** `{ bundleId: string, attendeeEmail: string, attendeeName: string }`  
**Action:** Creates a Stripe Checkout Session for the bundle price, stores a pending `BundlePurchase`, redirects client.

### POST `/api/slotly/bundles/webhook`
**Auth:** Stripe webhook signature  
**Action:** On `checkout.session.completed` — marks purchase as paid, sets `creditsTotal`, sets `paidAt`.

### GET `/api/slotly/bundles/credits?email={email}`
**Auth:** none (token-gated via query param or session)  
**Response:** `{ bundleId, bundleName, creditsTotal, creditsUsed, creditsRemaining, expiresAt }`

### POST `/api/slotly/bundles/use-credit`
**Auth:** called by Cal.com booking webhook (BOOKING_CREATED)  
**Body:** `{ bookingUid: string, attendeeEmail: string }`  
**Action:** Finds the active purchase for that email, debits one credit, creates a `BundleBookingUsage` row.  
**Error cases:** no purchase found → 402 (Cal.com booking should be blocked); credits exhausted → 402.

---

## Booking Flow

```
Client visits /book/{eventType}?bundle={purchaseId}
          │
          ▼
Cal.com booking page (normal)
          │
          ▼ BOOKING_CREATED webhook fires
          │
          ▼
/api/slotly/bundles/use-credit
  ├─ valid credit → debit, allow booking
  └─ no credit   → respond 4xx (booking workflow handles cancel)
```

### Blocking a booking without a valid bundle credit

Option A (preferred): Configure the event type to require payment via Stripe. Use `HOLD` mode with $0 — a
webhook cancels the hold and confirms only when a valid credit exists.

Option B: Set the event type to "Requires approval". The `use-credit` webhook fires on creation, auto-approves
if credit found, auto-rejects if not.

**Recommendation:** Option B is simpler, avoids Stripe complexity for clients who already paid for a pack.

---

## Admin UI (Phase 2)

- `/slotly/bundles` — coach dashboard: create bundles, view purchases, see per-client credit usage
- Embedded credit counter on the client-facing booking page ("You have 3 sessions remaining")

---

## Stripe Setup

1. Create a Stripe Product per bundle type (one-time payment, not subscription).
2. Store the `stripePriceId` in `SessionBundle.stripePriceId`.
3. Use Stripe Checkout (hosted) — no PCI surface to manage.
4. Webhook: `checkout.session.completed` → credit the purchase.

---

## Scope Decisions

| Decision | Choice | Reason |
|---|---|---|
| Storage | New Prisma tables | Keeps bundle state isolated; no Cal.com schema changes |
| Payment | Stripe Checkout one-time | Simplest; reuses existing Stripe Connect keys |
| Credit enforcement | Booking approval flow | No Stripe hold complexity |
| Expiry | Optional `expiresAt` | Set to 12 months from purchase as default |
| Multi-bundle | One active bundle per attendee email per coach | MVP simplicity |

---

## Acceptance Criteria (implementation phase)

- [x] `SessionBundle`, `BundlePurchase`, `BundleBookingUsage` tables in Prisma schema
- [ ] Coach can create a bundle product via `/slotly/bundles/new` (UI — Phase 2)
- [x] Client can purchase a 5-session pack via Stripe Checkout (`/api/slotly/bundles/checkout`)
- [x] On BOOKING_CREATED, one credit is debited (`/api/slotly/bundles/use-credit`)
- [x] Credits exhausted → 402 response (booking workflow auto-rejects via approval flow)
- [ ] Client sees remaining credits on the booking page (UI — Phase 2)

### Env vars required (add to DEPLOY.md / Vercel settings)
- `STRIPE_BUNDLE_WEBHOOK_SECRET` — from Stripe dashboard after registering `/api/slotly/bundles/webhook`

---

## Estimated Effort

| Component | Estimate |
|---|---|
| Prisma schema + migration | 2h |
| Stripe checkout + webhook | 4h |
| use-credit webhook + approval integration | 3h |
| Coach bundle admin UI | 6h |
| Client credit display on booking page | 3h |
| **Total** | **~18h** |
