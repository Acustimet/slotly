# Slotly — Deploy to Vercel (10 minutes)

This guide deploys Slotly to Vercel + Supabase. Both free tiers.

## Prerequisites

1. A Vercel account at https://vercel.com (free)
2. A Supabase account at https://supabase.com (free)

---

## Step 1: Create Supabase database

1. Go to https://supabase.com/dashboard → New project
2. Name: `slotly-prod`
3. Password: generate a strong one, save it
4. Region: pick closest to you
5. Wait ~2 min for it to spin up
6. Go to Settings → Database → Connection string → "URI" mode
7. Copy the connection string — it looks like: `postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres`
8. Also copy the "Direct connection" string (port 5432)

---

## Step 2: Generate secrets

Run these in your terminal:

```bash
# NEXTAUTH_SECRET (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# CALENDSO_ENCRYPTION_KEY (32 chars)
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

Save the outputs.

---

## Step 3: Deploy to Vercel

### Option A: Vercel Dashboard (easiest)

1. Go to https://vercel.com/new
2. Import Git repository → GitHub → select `Acustimet/slotly`
3. Root Directory: `apps/web`
4. Build command: `cd ../.. && yarn build --filter=@calcom/web`
5. Output directory: `.next`
6. Node.js version: 20.x
7. Click "Environment Variables" and add all vars from Step 4 below
8. Click Deploy

### Option B: Vercel CLI

```bash
npm install -g vercel
cd C:\Users\sonte\SoftwareDevelopment\slotly\apps\web
vercel login  # opens browser
vercel --prod
```

---

## Step 4: Environment variables to set in Vercel

Copy these exactly into Vercel → Settings → Environment Variables:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[SUPABASE_HOST]:6543/postgres?sslmode=require&connection_limit=1
DATABASE_DIRECT_URL=postgresql://postgres:[PASSWORD]@[SUPABASE_HOST]:5432/postgres?sslmode=require
NEXT_PUBLIC_WEBAPP_URL=https://slotly.vercel.app
NEXT_PUBLIC_WEBSITE_URL=https://slotly.vercel.app
NEXTAUTH_URL=https://slotly.vercel.app
NEXTAUTH_SECRET=[your generated secret]
CALENDSO_ENCRYPTION_KEY=[your generated key]
NEXT_PUBLIC_APP_NAME=Slotly
NEXT_PUBLIC_COMPANY_NAME=Slotly
NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS=support@slotly.app
CALCOM_TELEMETRY_DISABLED=1
CRON_API_KEY=slotly-prod-cron-key
CRON_ENABLE_APP_SYNC=false
NEXT_PUBLIC_EMBED_LIB_URL=https://slotly.vercel.app/embed/embed.js
GOOGLE_LOGIN_ENABLED=false
OUTLOOK_LOGIN_ENABLED=false
# Slotly vertical features
SLOTLY_WEBHOOK_SECRET=[generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
STRIPE_BUNDLE_WEBHOOK_SECRET=[from Stripe dashboard after registering /api/slotly/bundles/webhook]
# Slotly SaaS billing (Stripe subscriptions)
STRIPE_PRIVATE_KEY=[sk_test_... from Stripe dashboard → Developers → API keys]
SLOTLY_PRO_PRICE_ID=[price_... create a $9/mo recurring price in Stripe Products]
SLOTLY_TEAM_PRICE_ID=[price_... create a $29/mo recurring price in Stripe Products]
SLOTLY_STRIPE_WEBHOOK_SECRET=[whsec_... from Stripe dashboard after registering /api/slotly/webhook]
```

---

## Step 5: Run database migrations

After first deploy, open Vercel → Deployments → your latest → Terminal (or use local):

```bash
cd C:\Users\sonte\SoftwareDevelopment\slotly
DATABASE_URL="<your supabase url>" yarn workspace @calcom/prisma db-deploy
```

Or with the Vercel CLI:
```bash
vercel env pull .env.production.local
yarn workspace @calcom/prisma db-deploy
```

---

## Step 5b: Configure transactional email (Resend)

Cal.com has native Resend support. You only need **2 env vars** — no SMTP config required.

### Option A: Sandbox (MVP — no domain verification needed)

1. Sign up at https://resend.com (free, no credit card)
2. Go to API Keys → Create API Key (full access)
3. Set in Vercel → Settings → Environment Variables:

```
RESEND_API_KEY=re_xxxx
EMAIL_FROM=onboarding@resend.dev
```

4. Redeploy. Signup + booking confirmation emails will work immediately.

> Limitation: emails appear to come from `onboarding@resend.dev`, not `noreply@slotly-chi.vercel.app`.
> Fine for MVP — upgrade to Option B when you have a real domain.

### Option B: Production (domain verified — recommended before first paying customer)

1. In Resend dashboard → Domains → Add Domain → `slotly-chi.vercel.app` (or custom domain)
2. Add the DNS records Resend shows you (in Vercel or Cloudflare)
3. Set in Vercel:

```
RESEND_API_KEY=re_xxxx
EMAIL_FROM=noreply@slotly-chi.vercel.app
```

4. Redeploy.

---

## Step 6: Verify

1. Visit https://slotly.vercel.app
2. Should see: "Book, pay, done." landing page
3. Click "Start free" → create account → check inbox for verification email
4. Create event type → test booking → check inbox for confirmation email
5. Done!

---

## Billing setup (after deploy)

See `docs/billing/README.md` for:
- Stripe Connect setup (client pays pro at booking)
- Lemon Squeezy setup ($9/mo SaaS subscription)

---

## Domain (optional upgrade)

To use a real domain (slotly.io, $10-15/yr):
1. Buy domain at Cloudflare Registrar (at-cost pricing)
2. In Vercel → Settings → Domains → Add domain
3. Follow DNS instructions
4. Update NEXT_PUBLIC_WEBAPP_URL and NEXTAUTH_URL to new domain

