import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { WEBAPP_URL } from "@calcom/lib/constants";
import prisma from "@calcom/prisma";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY ?? "", {
  apiVersion: "2020-08-27",
});

const PRICE_IDS: Record<string, string | undefined> = {
  pro: process.env.SLOTLY_PRO_PRICE_ID,
  team: process.env.SLOTLY_TEAM_PRICE_ID,
};

export async function POST(req: Request) {
  const session = await getServerSession({
    req: buildLegacyRequest(await headers(), await cookies()),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = body?.plan as string | undefined;
  if (plan !== "pro" && plan !== "team") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json(
      {
        error: `Price ID for plan '${plan}' is not configured. Set SLOTLY_${plan.toUpperCase()}_PRICE_ID env var.`,
      },
      { status: 500 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, metadata: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const meta = (user.metadata as Record<string, unknown>) ?? {};
  let customerId = meta.closedateStripeCustomerId as string | undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { closedateUserId: String(session.user.id) },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { metadata: { ...meta, closedateStripeCustomerId: customerId } },
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? WEBAPP_URL;
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${baseUrl}/pricing?success=true&plan=${plan}`,
    cancel_url: `${baseUrl}/pricing?cancelled=true`,
    metadata: {
      closedateUserId: String(session.user.id),
      closedatePlan: plan,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
