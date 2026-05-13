-- Slotly: Session bundle / package bookings (SON-14)
BEGIN;

CREATE TABLE "public"."SessionBundle" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripePriceId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionBundle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."BundlePurchase" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "attendeeEmail" TEXT NOT NULL,
    "attendeeName" TEXT NOT NULL,
    "creditsTotal" INTEGER NOT NULL,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "stripeSessionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BundlePurchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."BundleBookingUsage" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "bookingUid" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BundleBookingUsage_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
ALTER TABLE "public"."BundlePurchase" ADD CONSTRAINT "BundlePurchase_stripeSessionId_key" UNIQUE ("stripeSessionId");

-- Indexes
CREATE INDEX "BundlePurchase_attendeeEmail_idx" ON "public"."BundlePurchase"("attendeeEmail");
CREATE INDEX "BundlePurchase_bundleId_idx" ON "public"."BundlePurchase"("bundleId");
CREATE INDEX "BundleBookingUsage_purchaseId_idx" ON "public"."BundleBookingUsage"("purchaseId");
CREATE INDEX "BundleBookingUsage_bookingUid_idx" ON "public"."BundleBookingUsage"("bookingUid");

-- Foreign keys
ALTER TABLE "public"."SessionBundle" ADD CONSTRAINT "SessionBundle_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."BundlePurchase" ADD CONSTRAINT "BundlePurchase_bundleId_fkey"
    FOREIGN KEY ("bundleId") REFERENCES "public"."SessionBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."BundleBookingUsage" ADD CONSTRAINT "BundleBookingUsage_purchaseId_fkey"
    FOREIGN KEY ("purchaseId") REFERENCES "public"."BundlePurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
