import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@calcom/prisma";

function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const webhookSecret = process.env.SLOTLY_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(500).json({ error: "SLOTLY_WEBHOOK_SECRET not set" });

  const raw = await getRawBody(req);
  const sig = req.headers["x-cal-signature-256"] as string | undefined;
  if (!sig) return res.status(401).json({ error: "Missing signature" });

  const expected = crypto.createHmac("sha256", webhookSecret).update(raw).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const body = JSON.parse(raw.toString()) as {
    triggerEvent?: string;
    payload?: { uid?: string; attendees?: Array<{ email: string }> };
  };

  if (body.triggerEvent !== "BOOKING_CREATED") {
    return res.status(200).json({ skipped: true });
  }

  const bookingUid = body.payload?.uid;
  const attendeeEmail = body.payload?.attendees?.[0]?.email;

  if (!bookingUid || !attendeeEmail) {
    return res.status(400).json({ error: "Missing bookingUid or attendeeEmail" });
  }

  // Find the active, paid purchase with remaining credits
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const purchase = await (prisma as any).bundlePurchase.findFirst({
    where: {
      attendeeEmail,
      paidAt: { not: null },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { paidAt: "asc" },
  });

  if (!purchase) {
    return res.status(402).json({ error: "No active bundle purchase found for this email" });
  }

  if (purchase.creditsUsed >= purchase.creditsTotal) {
    return res.status(402).json({ error: "Bundle credits exhausted" });
  }

  // Debit one credit atomically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).$transaction([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).bundlePurchase.update({
      where: { id: purchase.id },
      data: { creditsUsed: { increment: 1 } },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).bundleBookingUsage.create({
      data: { purchaseId: purchase.id, bookingUid },
    }),
  ]);

  return res.status(200).json({
    ok: true,
    creditsRemaining: purchase.creditsTotal - purchase.creditsUsed - 1,
  });
}
