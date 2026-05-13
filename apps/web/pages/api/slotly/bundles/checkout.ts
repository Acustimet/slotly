import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import prisma from "@calcom/prisma";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY ?? "", { apiVersion: "2020-08-27" });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { bundleId, attendeeEmail, attendeeName } = req.body as {
    bundleId?: string;
    attendeeEmail?: string;
    attendeeName?: string;
  };

  if (!bundleId || !attendeeEmail || !attendeeName) {
    return res.status(400).json({ error: "bundleId, attendeeEmail, and attendeeName are required" });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bundle = await (prisma as any).sessionBundle.findUnique({ where: { id: bundleId } });
  if (!bundle || !bundle.active) return res.status(404).json({ error: "Bundle not found or inactive" });

  const baseUrl = process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://slotly.vercel.app";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: bundle.currency,
          unit_amount: bundle.price,
          product_data: { name: bundle.name, description: `${bundle.sessionCount} sessions` },
        },
        quantity: 1,
      },
    ],
    customer_email: attendeeEmail,
    metadata: { bundleId, attendeeEmail, attendeeName },
    success_url: `${baseUrl}/booking/bundle-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/booking/bundle-cancel`,
  });

  // Create pending purchase row
  await (prisma as any).bundlePurchase.create({
    data: {
      bundleId,
      attendeeEmail,
      attendeeName,
      creditsTotal: bundle.sessionCount,
      stripeSessionId: session.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  return res.status(200).json({ url: session.url });
}
