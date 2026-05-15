import { handlePaymentSuccess } from "@calcom/app-store/_utils/payments/handlePaymentSuccess";
import stripe from "@calcom/app-store/stripepayment/lib/server";
import { HttpError as HttpCode } from "@calcom/lib/http-error";
import prisma from "@calcom/prisma";
import { BookingStatus } from "@calcom/prisma/enums";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "STRIPE_WEBHOOK_SECRET not configured" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || Array.isArray(sig)) {
    return res.status(400).json({ message: "Missing or invalid stripe-signature header" });
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    return res.status(400).json({ message });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;

      const payment = await prisma.payment.findUnique({
        where: { externalId: paymentIntent.id },
        select: { id: true, bookingId: true, success: true },
      });

      if (!payment) {
        // Unknown payment intent — not ours (e.g., from a different integration)
        return res.status(200).json({ received: true });
      }

      if (!payment.success) {
        try {
          await handlePaymentSuccess({
            paymentId: payment.id,
            appSlug: "stripe",
            bookingId: payment.bookingId,
            traceContext: {},
          });
        } catch (err) {
          // handlePaymentSuccess throws HttpCode(200) on success — that is the expected exit path
          if (err instanceof HttpCode && err.statusCode >= 200 && err.statusCode < 300) {
            return res.status(200).json({ received: true });
          }
          console.error("[stripe/webhook] handlePaymentSuccess error:", err);
          // Return 500 so Stripe retries. The idempotency guard will short-circuit if the
          // DB transaction already committed before the throw.
          return res.status(500).json({ message: "Internal error processing payment" });
        }
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const payment = await prisma.payment.findUnique({
        where: { externalId: paymentIntent.id },
        select: { id: true, bookingId: true },
      });

      if (payment) {
        // Cancel the booking so it doesn't stay stuck in PENDING
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: BookingStatus.CANCELLED },
        });
        console.warn(
          `[stripe/webhook] Payment failed for bookingId ${payment.bookingId}, booking cancelled`
        );
      }
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;

      if (!paymentIntentId) {
        console.warn("[stripe/webhook] charge.refunded event missing payment_intent");
        return res.status(200).json({ received: true });
      }

      // Only mark as fully refunded when Stripe confirms the charge is fully refunded
      if (charge.refunded) {
        await prisma.payment.updateMany({
          where: { externalId: paymentIntentId },
          data: { refunded: true },
        });
      }
    } else {
      console.log(`[stripe/webhook] unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[stripe/webhook] Unexpected error handling event:", event.type, err);
    return res.status(500).json({ message: "Internal server error" });
  }

  return res.status(200).json({ received: true });
}
