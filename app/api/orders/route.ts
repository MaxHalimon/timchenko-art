import { NextRequest, NextResponse } from "next/server";
import { Prisma, type OrderItemVariant } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { localizedText } from "@/lib/localizedText";
import { describeItem } from "@/lib/orderItemText";
import { MAX_OIL_QUANTITY, MAX_PRINT_QUANTITY, PRINT_PRICE_EUR } from "@/lib/constants";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1/invoice";

type PaymentMethod = "card" | "crypto";

/** One line of the easel as the browser sends it: "3 oil paintings of X" or "7 prints of Y". */
interface EaselLineInput {
  slug: string;
  variant: "oil" | "print";
  quantity: number;
}

interface CreateOrderBody {
  items: EaselLineInput[]; // everything from the "Мольберт" (easel), paid in ONE payment
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

/** What gets stored: one row per (painting, variant). */
interface PlannedRow {
  productId: string;
  slug: string;
  title: string;
  variant: OrderItemVariant;
  quantity: number;
  unitCents: number;
}

/** Validates the raw lines and merges duplicates of the same (painting, variant). Returns null if anything is malformed. */
function parseLines(raw: unknown): EaselLineInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const merged = new Map<string, EaselLineInput>();

  for (const entry of raw) {
    const line = entry as Partial<EaselLineInput> | null;
    if (!line || typeof line.slug !== "string" || !line.slug) return null;
    if (line.variant !== "oil" && line.variant !== "print") return null;
    if (!Number.isInteger(line.quantity) || (line.quantity as number) < 1) return null;

    const key = `${line.slug}:${line.variant}`;
    const existing = merged.get(key);
    const quantity = (existing?.quantity ?? 0) + (line.quantity as number);
    const max = line.variant === "oil" ? MAX_OIL_QUANTITY : MAX_PRINT_QUANTITY;
    if (quantity > max) return null;
    merged.set(key, { slug: line.slug, variant: line.variant, quantity });
  }

  return Array.from(merged.values());
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateOrderBody;
  const paymentMethod: PaymentMethod = body.paymentMethod ?? "card";
  const locale: Locale = locales.includes(body.locale as Locale) ? (body.locale as Locale) : defaultLocale;

  const lines = parseLines(body.items);

  if (!lines || !body.customerEmail || !body.shippingAddress) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const slugs = Array.from(new Set(lines.map((line) => line.slug)));
  const products = await prisma.product.findMany({ where: { slug: { in: slugs } } });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  if (bySlug.size !== slugs.length) {
    return NextResponse.json({ error: "One or more paintings could not be found" }, { status: 404 });
  }

  // A painting that is still IN_PROGRESS isn't finished yet: there is nothing to
  // ship, repaint from, or print. (SOLD is fine - the existing original is gone,
  // but the artist repaints it on request and prints are always possible.)
  const unavailable = lines.filter((line) => bySlug.get(line.slug)!.status === "IN_PROGRESS");
  if (unavailable.length > 0) {
    return NextResponse.json(
      { error: "Painting is not available for purchase", slugs: Array.from(new Set(unavailable.map((l) => l.slug))) },
      { status: 409 },
    );
  }

  // Exclusive paintings are never repainted or printed: they can be bought once
  // (while still AVAILABLE), one piece, and nothing else.
  const exclusiveBreach = lines.filter((line) => {
    const product = bySlug.get(line.slug)!;
    if (!product.exclusive) return false;
    return line.variant === "print" || product.status !== "AVAILABLE" || line.quantity > 1;
  });
  if (exclusiveBreach.length > 0) {
    return NextResponse.json(
      { error: "Painting is not available for purchase", slugs: Array.from(new Set(exclusiveBreach.map((l) => l.slug))) },
      { status: 409 },
    );
  }

  // Turn easel lines into stored rows. The existing painting can go to ONE
  // buyer, so an oil line of a painting that is still AVAILABLE is
  // 1 ORIGINAL (reserved) + (quantity - 1) REPAINT; if it is already SOLD,
  // every copy is a REPAINT. Prints never touch the painting itself.
  const rows: PlannedRow[] = [];
  for (const line of lines) {
    const product = bySlug.get(line.slug)!;
    const title = localizedText(product.title, locale);
    const base = { productId: product.id, slug: product.slug, title };

    if (line.variant === "print") {
      rows.push({ ...base, variant: "PRINT", quantity: line.quantity, unitCents: Math.round(PRINT_PRICE_EUR * 100) });
      continue;
    }

    const unitCents = Math.round(Number(product.priceEur) * 100);
    const originals = product.status === "AVAILABLE" ? 1 : 0;
    if (originals === 1) rows.push({ ...base, variant: "ORIGINAL", quantity: 1, unitCents });
    if (line.quantity - originals > 0) {
      rows.push({ ...base, variant: "REPAINT", quantity: line.quantity - originals, unitCents });
    }
  }

  const amountCents = rows.reduce((sum, row) => sum + row.unitCents * row.quantity, 0);
  const amountEur = amountCents / 100;

  // Create the order in PREVIEW first — it only moves to PAID once the
  // relevant webhook confirms payment. An ORIGINAL row's unique
  // reservedProductId also holds that painting (see schema.prisma), so two
  // customers can't both check out the same existing piece at once.
  let order;
  try {
    order = await prisma.order.create({
      data: {
        customerEmail: body.customerEmail,
        customerName: body.customerName,
        shippingAddress: body.shippingAddress,
        amountEur,
        platformCommissionEur: 0, // set for real once the order reaches PAID
        artistPayoutEur: 0,
        status: "PREVIEW",
        locale,
        items: {
          create: rows.map((row) => ({
            productId: row.productId,
            variant: row.variant,
            quantity: row.quantity,
            priceEur: row.unitCents / 100,
            reservedProductId: row.variant === "ORIGINAL" ? row.productId : null,
          })),
        },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Someone else reserved the existing painting between the page load and now.
      return NextResponse.json(
        {
          error: "Painting is not available for purchase",
          slugs: rows.filter((r) => r.variant === "ORIGINAL").map((r) => r.slug),
        },
        { status: 409 },
      );
    }
    throw err;
  }

  if (paymentMethod === "card") {
    return createStripeCheckout(order.id, rows, locale, body.customerEmail);
  }

  return createNowPaymentsInvoice(order.id, rows, amountEur, locale);
}

async function createStripeCheckout(
  orderId: string,
  rows: PlannedRow[],
  locale: Locale,
  customerEmail: string,
) {
  try {
    // payment_method_types is deliberately NOT set. With it omitted, Stripe
    // Checkout shows whatever is switched on under Dashboard → Settings →
    // Payment methods that also fits the currency (EUR) and the customer's
    // device/country: cards, Apple Pay, Google Pay, PayPal... Turning a method
    // on or off is a Dashboard click, never a code change. (Listing types here
    // would silently override the Dashboard — see PAYMENTS_GUIDE.md.)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // One Stripe line per stored row, so a mixed easel (3 originals, 7 prints,
      // ...) is a single payment with every line itemised on Stripe's page.
      line_items: rows.map((row) => ({
        price_data: {
          currency: "eur",
          unit_amount: row.unitCents,
          product_data: { name: `Timchenko Art — ${describeItem(locale, row.title, row.variant, 1)}` },
        },
        quantity: row.quantity,
      })),
      customer_email: customerEmail, // pre-fills the email on Stripe's page and sends the receipt there
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
  rows: PlannedRow[],
  amountEur: number,
  locale: Locale,
) {
  if (!NOWPAYMENTS_API_KEY) {
    await prisma.order.delete({ where: { id: orderId } });
    return NextResponse.json(
      { error: "NOWPayments is not configured (NOWPAYMENTS_API_KEY missing)" },
      { status: 500 },
    );
  }

  // order_description is free text for the payer's invoice page; keep it short.
  const itemsText = rows.map((row) => describeItem(locale, row.title, row.variant, row.quantity)).join("; ");
  const description = `Timchenko Art — ${itemsText}`.slice(0, 250);

  const invoiceResponse = await fetch(NOWPAYMENTS_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": NOWPAYMENTS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: amountEur,
      price_currency: "eur",
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
