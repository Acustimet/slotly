import type { Metadata } from "next";
import { cookies, headers } from "next/headers";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import prisma from "@calcom/prisma";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

import PricingView from "~/pricing/pricing-view";

export const metadata: Metadata = {
  title: "Pricing — Closedate",
  description: "Simple, transparent pricing for SDR and BDR sales teams.",
};

export default async function PricingPage() {
  let currentPlan: string | null = null;
  try {
    const session = await getServerSession({
      req: buildLegacyRequest(await headers(), await cookies()),
    });
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { metadata: true },
      });
      const meta = user?.metadata as Record<string, unknown> | null;
      if (meta?.closedatePlan && typeof meta.closedatePlan === "string") {
        currentPlan = meta.closedatePlan;
      }
    }
  } catch {
    // unauthenticated or error — show pricing page without plan info
  }

  return <PricingView currentPlan={currentPlan} />;
}
