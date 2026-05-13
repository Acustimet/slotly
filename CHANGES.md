# CHANGES.md — Slotly modifications to Cal.com

This file documents every modification Slotly has made to the upstream
[Cal.com](https://github.com/calcom/cal.com) codebase. Maintained to satisfy
the AGPL-3.0 source-disclosure obligation (§13) and as good-faith transparency
for users and operators.

## Base upstream commit

```
fb0149453e97a047f44ec21e99f9d8af420d8365
"fix: "Deadlinks" → "Dead links" in SECURITY.md (#29292)"
```

All Slotly-specific commits sit on top of this SHA.

---

## Changes by issue / feature

### SON-9 — Fork Cal.com (setup)

*No code modifications to Cal.com files.*
The repository `Acustimet/slotly` was created by pushing the Cal.com codebase
as-is. Environment variable templates already present in Cal.com upstream were
used without alteration.

### SON-10 — Brand swap (PENDING)

*Not yet committed.* Logo, product name, and landing-page copy changes will be
recorded here once the brand-swap commits are merged.

Planned scope:
- Product name: Cal.com → Slotly
- Logo assets in `public/`
- Landing-page copy in `apps/web/public/` and any i18n strings referencing
  "Cal.com" in a user-facing context

### SON-13 — SaaS billing (Lemon Squeezy + Stripe)

Commits:
- `601942b9` — `apps/web/pages/api/lemonsqueezy/webhook.ts`
  New route: Lemon Squeezy webhook handler for subscription lifecycle events
  (activated, cancelled, expired). Grants/revokes `PRO` plan in Slotly DB.

- `9468afcd` — `apps/web/pages/api/lemonsqueezy/checkout.ts`
  New route: checkout redirect endpoint. Accepts `?plan=pro&userId=...`,
  constructs a Lemon Squeezy checkout URL with pre-filled email, and redirects.

- `c7d09dd6` — `.env.billing.example`
  New file: env-var template documenting all Stripe Connect and Lemon Squeezy
  keys required for billing (not committed to `.env`).

- `c4e73033` — `docs/billing/README.md`
  New file: operator setup guide for Slotly SaaS billing (Stripe Connect
  flow and Lemon Squeezy flow).

### SON-18 — AGPL source disclosure

Commit: `9ad95ac7`

Modified files to add "Source code" footer link pointing to
`https://github.com/Acustimet/slotly`:

- `apps/web/app/(booking-page-wrapper)/layout.tsx` — footer injected on all
  booking-page routes
- `packages/ui/components/credits/Credits.tsx` — link appended to the Credits
  sidebar component visible in dashboard/settings views

### SON-14 — Vertical features (service professionals)

Commit: `12e4ab44`

New files only (no Cal.com files modified):

- `apps/web/pages/api/slotly/intake-summary.ts`
  HMAC-verified webhook handler for `BOOKING_CREATED` events. Sends a
  formatted HTML pre-meeting brief to the host with client intake responses.
  Uses Cal.com's existing `serverConfig`/nodemailer transport.

- `docs/slotly/stripe-payment-setup.md`
  Setup walkthrough for Stripe payment-required bookings using Cal.com's
  built-in Stripe Connect integration. No custom code added.

- `docs/slotly/session-bundles-spec.md`
  Design spec for session bundle/package bookings. Describes planned Prisma
  schema additions (`SessionBundle`, `BundlePurchase`, `BundleBookingUsage`)
  and API routes. **Not yet implemented** — spec only.

---

## How to keep this file current

After every PR that touches Cal.com-derived code:

1. Add an entry under the relevant issue section (or create a new one).
2. List each modified or added file and a one-line description of the change.
3. Record the commit SHA.
4. If you rebrand or remove a Cal.com file entirely, note that too.

For questions about AGPL obligations, see
[GNU AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) §4 and §13.
