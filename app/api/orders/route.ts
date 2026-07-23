import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1/invoice";

type PaymentMethod = "card" | "crypto";

interface CreateOrderBody {
  productSlug: string;
  customerEmail: string;
  customerName: string;
  paymentMethod?: PaymentMethod; // defaults to "card" — the primary checkout path
  locale?: string; // which storefront language the customer is checking out in
  shippingAddress: {
    country: string;
    city: string;
    postalCode: string;
    line1: string;
    line2?: string;
    phone: string;
  };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateOrderBody;
  const paymentMethod: PaymentMethod = body.paymentMethod ?? "card";
  const locale: Locale = locales.includes(body.locale as Locale) ? (body.locale as Locale) : defaultLocale;

  if (!body.productSlug || !body.customerEmail || !body.shippingAddress) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { slug: body.productSlug } });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.status !== "AVAILABLE") {
    // Covers both SOLD paintings and ones still IN_PROGRESS (not yet purchasable).
    return NextResponse.json({ error: "Painting is not available for purchase" }, { status: 409 });
  }

  const amountUsd = Number(product.priceUsd);

  // Create the order in PREVIEW first — it only moves to PAID once the
  // relevant webhook confirms payment. This also reserves the product row
  // (unique productId on Order) so two customers can't both check out the
  // same one-of-a-kind painting simultaneously.
  const order = await prisma.order.create({
    data: {
      productId: product.id,
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      shippingAddress: body.shippingAddress,
      amountUsd,
      platformCommissionUsd: 0, // set for real once the order reaches PAID
      artistPayoutUsd: 0,
      status: "PREVIEW",
    },
  });

  if (paymentMethod === "card") {
    return createStripeCheckout(order.id, product, amountUsd, locale);
  }

  return createNowPaymentsInvoice(order.id, product, amountUsd, locale);
}

async function createStripeCheckout(
  orderId: string,
  product: { slug: string; title: string },
  amountUsd: number,
  locale: Locale,
) {
  try {
    // automatic_payment_methods lets Stripe decide, per-visitor, whether to
    // surface Apple Pay / Google Pay / card — no separate integration needed
    // for wallets beyond enabling them once in the Stripe Dashboard.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amountUsd * 100),
            product_data: { name: `Tymchenko Art — ${product.title}` },
          },
          quantity: 1,
        },
      ],
      automatic_payment_methods: { enabled: true },
      metadata: { orderId },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/order/${orderId}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/product/${product.slug}`,
    });

    await prisma.payment.create({
      data: {
        orderId,
        provider: "STRIPE",
        status: "PENDING",
        providerRef: session.id,
      },
    });

    return NextResponse.json({ orderId, checkoutUrl: session.url });
  } catch (err) {
    // Roll back the reserved order so the painting isn't stuck unavailable
    // for no reason if Stripe itself rejected the request.
    await prisma.order.delete({ where: { id: orderId } });
    console.error("Stripe checkout session creation failed", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 502 });
  }
}

async function createNowPaymentsInvoice(
  orderId: string,
  product: { slug: string; title: string },
  amountUsd: number,
  locale: Locale,
) {
  if (!NOWPAYMENTS_API_KEY) {
    await prisma.order.delete({ where: { id: orderId } });
    return NextResponse.json(
      { error: "NOWPayments is not configured (NOWPAYMENTS_API_KEY missing)" },
      { status: 500 },
    );
  }

  const invoiceResponse = await fetch(NOWPAYMENTS_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": NOWPAYMENTS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: amountUsd,
      price_currency: "usd",
      order_id: orderId,
      order_description: `Tymchenko Art — ${product.title}`,
      ipn_callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/nowpayments`,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/order/${orderId}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/product/${product.slug}`,
    }),
  });

  if (!invoiceResponse.ok) {
    await prisma.order.delete({ where: { id: orderId } });
    return NextResponse.json({ error: "Failed to create payment invoice" }, { status: 502 });
  }

  const invoice = await invoiceResponse.json();

  await prisma.payment.create({
    data: {
      orderId,
      provider: "NOWPAYMENTS",
      status: "PENDING",
      providerRef: String(invoice.id),
    },
  });

  return NextResponse.json({ orderId, checkoutUrl: invoice.invoice_url });
}

