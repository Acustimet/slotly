import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession({ req });
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID_MONTHLY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;

  if (!variantId || !storeId) {
    return res.status(500).json({ error: "Billing not configured" });
  }

  // Build Lemon Squeezy checkout URL with prefilled customer data and user_id for webhook matching
  const checkoutUrl = new URL(`https://checkout.lemonsqueezy.com/checkout/buy/${variantId}`);
  checkoutUrl.searchParams.set("embed", "0");
  checkoutUrl.searchParams.set("checkout[email]", session.user.email ?? "");
  checkoutUrl.searchParams.set("checkout[name]", session.user.name ?? "");
  checkoutUrl.searchParams.set("checkout[custom][user_id]", String(session.user.id));

  return res.redirect(303, checkoutUrl.toString());
}
