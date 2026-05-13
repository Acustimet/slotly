import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import prisma from "@calcom/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession({ req, res });
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthenticated" });

  const userId = session.user.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  if (req.method === "GET") {
    const bundles = await db.sessionBundle.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ bundles });
  }

  if (req.method === "POST") {
    const { name, sessionCount, price, currency } = req.body as {
      name?: string;
      sessionCount?: number;
      price?: number;
      currency?: string;
    };
    if (!name || !sessionCount || !price) {
      return res.status(400).json({ error: "name, sessionCount, and price are required" });
    }
    const bundle = await db.sessionBundle.create({
      data: {
        userId,
        name,
        sessionCount: Number(sessionCount),
        price: Number(price),
        currency: currency ?? "usd",
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
}
