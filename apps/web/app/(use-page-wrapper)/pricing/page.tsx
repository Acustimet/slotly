import type { Metadata } from "next";
import { cookies, headers } from "next/headers";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import prisma from "@calcom/prisma";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

import PricingView from "~/pricing/pricing-view";

export const metadata: Metadata = {
  title: "Pricing — Slotly",
  description: "Simple, transparent pricing for coaches, consultants & freelancers.",
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
      if (meta?.slotlyPlan && typeof meta.slotlyPlan === "string") {
        currentPlan = meta.slotlyPlan;
      }
    }
  } catch {
    // unauthenticated or error — show pricing page without plan info
  }

  return <PricingView currentPlan={currentPlan} />;
}
