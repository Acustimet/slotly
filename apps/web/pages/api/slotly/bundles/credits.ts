import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@calcom/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const email = req.query.email as string | undefined;
  const bundleId = req.query.bundleId as string | undefined;

  if (!email) return res.status(400).json({ error: "email query param required" });

  const where: Record<string, unknown> = {
    attendeeEmail: email,
    paidAt: { not: null },
  };
  if (bundleId) where.bundleId = bundleId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const purchases = await (prisma as any).bundlePurchase.findMany({
    where,
    include: { bundle: { select: { name: true } } },
    orderBy: { paidAt: "desc" },
  });

  const result = purchases
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => !p.expiresAt || p.expiresAt > new Date())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => ({
      purchaseId: p.id,
      bundleId: p.bundleId,
      bundleName: p.bundle?.name ?? "",
      creditsTotal: p.creditsTotal,
      creditsUsed: p.creditsUsed,
      creditsRemaining: p.creditsTotal - p.creditsUsed,
      expiresAt: p.expiresAt,
    }));

  return res.status(200).json({ purchases: result });
}
