import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { calculatePlatformCommissionUsd, calculateArtistPayoutUsd } from "@/lib/constants";

/**
 * NOWPayments IPN callback.
 * Docs: https://documenter.getpostman.com/view/7907941/S1a32n38#ipn
 *
 * NOWPayments signs the callback body with HMAC-SHA512 using your IPN
 * secret, over the JSON-stringified payload with keys sorted alphabetically.
 * The signature arrives in the `x-nowpayments-sig` header.
 */

const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

// Statuses NOWPayments can send; only `finished`/`confirmed` count as paid.
// See their docs for the full list — `partially_paid`, `expired`, `failed`
// etc. all fall through to "not yet paid" below.
const PAID_STATUSES = new Set(["finished", "confirmed"]);
const FAILED_STATUSES = new Set(["failed", "expired", "refunded"]);

function sortObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {} as Record<string, unknown>);
}

function verifySignature(rawBody: Record<string, unknown>, signature: string | null): boolean {
  if (!IPN_SECRET || !signature) return false;
  const sortedBody = JSON.stringify(sortObjectKeys(rawBody));
  const expected = crypto.createHmac("sha512", IPN_SECRET).update(sortedBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-nowpayments-sig");
  const body = await req.json();

  if (!verifySignature(body, signature)) {
    // Never trust an unsigned or mis-signed callback — this endpoint is
    // publicly reachable and a forged "paid" event would ship a painting
    // for free.
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { payment_id: providerRef, payment_status: paymentStatus } = body as {
    payment_id: string;
    payment_status: string;
  };

  if (!providerRef) {
    return NextResponse.json({ error: "Missing payment_id" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { providerRef: String(providerRef) },
    include: { order: { include: { product: true } } },
  });

  if (!payment) {
    // Log for investigation, but respond 200 so NOWPayments doesn't retry
    // forever for a payment_id we'll never recognize.
    console.error(`NOWPayments IPN: unknown payment_id ${providerRef}`);
    return NextResponse.json({ received: true });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      rawWebhookPayload: body,
      status: PAID_STATUSES.has(paymentStatus)
        ? "CONFIRMED"
        : FAILED_STATUSES.has(paymentStatus)
          ? "FAILED"
          : "PENDING",
    },
  });

  // Idempotency: if this order is already past PREVIEW, don't re-process
  // (NOWPayments can and will send the same IPN more than once).
  if (PAID_STATUSES.has(paymentStatus) && payment.order.status === "PREVIEW") {
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
      prisma.product.update({
        where: { id: payment.order.productId },
        data: { status: "SOLD" },
      }),
    ]);

    // TODO: notify the artist (email/telegram) that a new order needs to
    // move to IN_PROGRESS, and send the customer a payment confirmation.
  }

  return NextResponse.json({ received: true });
}
