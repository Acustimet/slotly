import prisma from "@calcom/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY ?? "", {
  apiVersion: "2020-08-27",
});

const WEBHOOK_SECRET = process.env.CLOSEDATE_STRIPE_WEBHOOK_SECRET ?? "";

function planFromPriceId(priceId: string): string | null {
  if (priceId === process.env.CLOSEDATE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.CLOSEDATE_TEAM_PRICE_ID) return "team";
  return null;
}

async function updateUserPlan(userId: number, plan: string, subscriptionId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
  const meta = (user?.metadata as Record<string, unknown>) ?? {};
  await prisma.user.update({
    where: { id: userId },
    data: {
      metadata: {
        ...meta,
        closedatePlan: plan,
        closedateStripeSubscriptionId: subscriptionId,
      },
    },
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const h = await headers();
  const sig = h.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.closedateUserId;
        const plan = session.metadata?.closedatePlan;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;

        if (userId && plan && subscriptionId) {
          await updateUserPlan(parseInt(userId, 10), plan, subscriptionId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price?.id;
        const plan = priceId ? planFromPriceId(priceId) : null;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        if (plan && customerId) {
          const user = await prisma.user.findFirst({
            where: {
              metadata: { path: ["closedateStripeCustomerId"], equals: customerId },
            },
            select: { id: true },
          });
          if (user) {
            await updateUserPlan(user.id, plan, sub.id);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        const user = await prisma.user.findFirst({
          where: {
            metadata: { path: ["closedateStripeCustomerId"], equals: customerId },
          },
          select: { id: true, metadata: true },
        });
        if (user) {
          const meta = (user.metadata as Record<string, unknown>) ?? {};
          await prisma.user.update({
            where: { id: user.id },
            data: {
              metadata: {
                ...meta,
                closedatePlan: "free",
                closedateStripeSubscriptionId: null,
              },
            },
          });
        }
        break;
      }

      default:
        // unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error("[closedate/webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
