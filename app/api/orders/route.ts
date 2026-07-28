import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1/invoice";

type PaymentMethod = "card" | "crypto";

interface CreateOrderBody {
  productSlugs: string[]; // one or more paintings from the "Мольберт" (easel)
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

  const productSlugs = Array.isArray(body.productSlugs) ? body.productSlugs.filter(Boolean) : [];

  if (productSlugs.length === 0 || !body.customerEmail || !body.shippingAddress) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const products = await prisma.product.findMany({ where: { slug: { in: productSlugs } } });

  if (products.length !== productSlugs.length) {
    return NextResponse.json({ error: "One or more paintings could not be found" }, { status: 404 });
  }

  const unavailable = products.filter((p) => p.status !== "AVAILABLE");
  if (unavailable.length > 0) {
    // Covers both SOLD paintings and ones still IN_PROGRESS (not yet purchasable) —
    // e.g. someone else bought it, or it went off-sale, while this was on the easel.
    return NextResponse.json(
      { error: "Painting is not available for purchase", slugs: unavailable.map((p) => p.slug) },
      { status: 409 },
    );
  }

  const amountUsd = products.reduce((sum, p) => sum + Number(p.priceUsd), 0);

  // Create the order in PREVIEW first — it only moves to PAID once the
  // relevant webhook confirms payment. Each OrderItem's unique productId
  // also reserves that painting (see schema.prisma) so two customers can't
  // both check out the same one-of-a-kind piece simultaneously.
  const order = await prisma.order.create({
    data: {
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      shippingAddress: body.shippingAddress,
      amountUsd,
      platformCommissionUsd: 0, // set for real once the order reaches PAID
      artistPayoutUsd: 0,
      status: "PREVIEW",
      items: {
        create: products.map((p) => ({
          productId: p.id,
          priceUsd: p.priceUsd,
        })),
      },
    },
  });

  if (paymentMethod === "card") {
    return createStripeCheckout(order.id, products, locale);
  }

  return createNowPaymentsInvoice(order.id, products, amountUsd, locale);
}

async function createStripeCheckout(
  orderId: string,
  products: { slug: string; title: string; priceUsd: unknown }[],
  locale: Locale,
) {
  try {
    // automatic_payment_methods lets Stripe decide, per-visitor, whether to
    // surface Apple Pay / Google Pay / card — no separate integration needed
    // for wallets beyond enabling them once in the Stripe Dashboard.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: products.map((product) => ({
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(product.priceUsd) * 100),
          product_data: { name: `Timchenko Art — ${product.title}` },
        },
        quantity: 1,
      })),
      // automatic_payment_methods: { enabled: true },
      metadata: { orderId },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/order/${orderId}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/easel`,
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
    // Roll back the reserved order (and its OrderItems, via onDelete:
    // Cascade in the schema) so the paintings aren't stuck unavailable for
    // no reason if Stripe itself rejected the request.
    await prisma.order.delete({ where: { id: orderId } });
    console.error("Stripe checkout session creation failed", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 502 });
  }
}

async function createNowPaymentsInvoice(
  orderId: string,
  products: { slug: string; title: string }[],
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

  const description =
    products.length === 1
      ? `Timchenko Art — ${products[0].title}`
      : `Timchenko Art — ${products.length} paintings (${products.map((p) => p.title).join(", ")})`;

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
      order_description: description,
      ipn_callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/nowpayments`,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/order/${orderId}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/easel`,
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
