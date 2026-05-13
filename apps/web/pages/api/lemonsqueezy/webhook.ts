import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@calcom/prisma";

type LemonSqueezyEvent = {
  meta: {
    event_name: string;
    custom_data?: { user_id?: string };
  };
  data: {
    id: string;
    attributes: {
      status: "active" | "paused" | "cancelled" | "expired" | "unpaid" | "past_due" | "on_trial";
      customer_id: number;
      user_email: string;
      user_name: string;
    };
  };
};

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const signature = req.headers["x-signature"] as string;
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return res.status(401).json({ error: "Missing signature or secret" });
  }

  const rawBody = JSON.stringify(req.body);
  if (!verifySignature(rawBody, signature, secret)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = req.body as LemonSqueezyEvent;
  const { event_name } = event.meta;
  const { status, customer_id, user_email } = event.data.attributes;
  const subscriptionId = event.data.id;
  const userId = event.meta.custom_data?.user_id
    ? parseInt(event.meta.custom_data.user_id, 10)
    : null;

  const isPro = status === "active" || status === "on_trial";

  try {
    let user = null;

    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, metadata: true } });
    }
    if (!user && user_email) {
      user = await prisma.user.findFirst({ where: { email: user_email }, select: { id: true, metadata: true } });
    }

    if (!user) {
      console.error(`[LemonSqueezy] No user found for event ${event_name}, customer ${customer_id}`);
      return res.status(200).json({ received: true });
    }

    const currentMetadata = (user.metadata as Record<string, unknown>) ?? {};
    await prisma.user.update({
      where: { id: user.id },
      data: {
        metadata: {
          ...currentMetadata,
          slotlyPlan: isPro ? "pro" : "free",
          lemonsqueezyCustomerId: String(customer_id),
          lemonsqueezySubscriptionId: subscriptionId,
          lemonsqueezyStatus: status,
        },
        hideBranding: isPro,
      },
    });

    console.log(`[LemonSqueezy] Updated user ${user.id} plan to ${isPro ? "pro" : "free"} (${event_name})`);
  } catch (err) {
    console.error("[LemonSqueezy] Webhook handler error:", err);
    return res.status(500).json({ error: "Internal error" });
  }

  return res.status(200).json({ received: true });
}

export const config = {
  api: { bodyParser: { type: "application/json" } },
};
