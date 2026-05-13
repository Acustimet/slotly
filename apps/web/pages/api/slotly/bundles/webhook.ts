import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import prisma from "@calcom/prisma";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY ?? "", { apiVersion: "2020-08-27" });

export const config = { api: { bodyParser: false } };

function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_BUNDLE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(500).json({ error: "STRIPE_BUNDLE_WEBHOOK_SECRET not set" });

  const raw = await getRawBody(req);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch {
    return res.status(400).json({ error: "Invalid Stripe signature" });
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ skipped: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (!session.id) return res.status(400).json({ error: "No session id" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).bundlePurchase.updateMany({
    where: { stripeSessionId: session.id, paidAt: null },
    data: { paidAt: new Date() },
  });

  return res.status(200).json({ ok: true });
}
