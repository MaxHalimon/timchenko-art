import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { calculatePlatformCommissionUsd, calculateArtistPayoutUsd } from "@/lib/constants";
import type Stripe from "stripe";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text(); // Stripe needs the raw, unparsed body to verify the signature

  if (!signature || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 401 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err) {
    // Signature verification failed — never trust an unverified payload here,
    // this endpoint is publicly reachable and a forged "paid" event would
    // ship a painting for free.
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error("Stripe webhook: checkout.session.completed with no orderId in metadata");
      return NextResponse.json({ received: true });
    }

    const payment = await prisma.payment.findUnique({
      where: { providerRef: session.id },
      include: { order: { include: { items: true } } },
    });

    if (!payment) {
      console.error(`Stripe webhook: no Payment row for session ${session.id}`);
      return NextResponse.json({ received: true });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "CONFIRMED", rawWebhookPayload: session as unknown as object },
    });

    // Idempotency: Stripe retries webhooks, and can send the same event more
    // than once — only transition an order that's still in PREVIEW.
    if (payment.order.status === "PREVIEW") {
      const amountUsd = Number(payment.order.amountUsd);

      await prisma.$transaction([
        prisma.order.update({
          where: { id: payment.order.id },
          data: {
            status: "PAID",
            platformCommissionUsd: calculatePlatformCommissionUsd(amountUsd),
            artistPayoutUsd: calculateArtistPayoutUsd(amountUsd),
          },
        }),
        prisma.product.updateMany({
          where: { id: { in: payment.order.items.map((item) => item.productId) } },
          data: { status: "SOLD" },
        }),
      ]);

      // TODO: notify the artist (email/telegram) that a new order needs to
      // move to IN_PROGRESS, and send the customer a payment confirmation.
    }
  }

  // Card payments can fail after the checkout session was created (declined,
  // 3DS abandoned, etc.) — mark those so the product/order don't hang silently.
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const payment = await prisma.payment.findUnique({ where: { providerRef: session.id } });
    if (payment) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "EXPIRED" } });
    }
  }

  return NextResponse.json({ received: true });
}
