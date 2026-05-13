import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import prisma from "@calcom/prisma";

const ALLOWED_CURRENCIES = ["usd", "eur", "gbp", "sek", "nok", "dkk", "cad", "aud"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession({ req, res });
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthenticated" });

  const userId = session.user.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  try {
    if (req.method === "GET") {
      const bundles = await db.sessionBundle.findMany({
        where: { userId, active: true },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json({ bundles });
    }

    if (req.method === "POST") {
      const { name, sessionCount, price, currency } = req.body as {
        name?: string;
        sessionCount?: unknown;
        price?: unknown;
        currency?: unknown;
      };
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "name is required" });
      }
      if (name.length > 100) {
        return res.status(400).json({ error: "name must be 100 characters or fewer" });
      }
      const parsedCount = Number(sessionCount);
      if (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > 100) {
        return res.status(400).json({ error: "sessionCount must be an integer between 1 and 100" });
      }
      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 100) {
        return res.status(400).json({ error: "price must be at least 100 cents ($1.00)" });
      }
      const curr = typeof currency === "string" ? currency.toLowerCase() : "usd";
      if (!ALLOWED_CURRENCIES.includes(curr)) {
        return res.status(400).json({ error: `currency must be one of: ${ALLOWED_CURRENCIES.join(", ")}` });
      }
      const bundle = await db.sessionBundle.create({
        data: {
          userId,
          name: name.trim(),
          sessionCount: parsedCount,
          price: parsedPrice,
          currency: curr,
        },
      });
      return res.status(201).json({ bundle });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") return res.status(400).json({ error: "id required" });
      const existing = await db.sessionBundle.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) return res.status(404).json({ error: "Not found" });
      await db.sessionBundle.update({ where: { id }, data: { active: false } });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[bundles/manage] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
