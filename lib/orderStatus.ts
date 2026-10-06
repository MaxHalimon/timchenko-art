import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { renderOrderStatusEmail, type EmailableStatus } from "./orderEmails";
import { isPrintOnly, subjectTitle, summarizeItems } from "./orderItemText";
import { calculatePlatformCommissionEur, calculateArtistPayoutEur } from "./constants";
import type { Locale } from "@/i18n/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function loadOrderForEmail(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
}

async function notifyOrderStatus(orderId: string, status: EmailableStatus) {
  const order = await loadOrderForEmail(orderId);
  if (!order) return;

  const locale = (order.locale as Locale) ?? "uk";

  const { subject, html } = renderOrderStatusEmail({
    locale,
    status,
    customerName: order.customerName,
    orderId: order.id,
    itemSummaries: summarizeItems(locale, order.items),
    subjectTitle: subjectTitle(locale, order.items),
    printOnly: isPrintOnly(order.items),
    trackingUrl: `${SITE_URL}/${locale}/tracking?ref=${order.id}`,
    trackingNumber: order.trackingNumber,
    trackingCarrier: order.trackingCarrier,
    contactUrl: `${SITE_URL}/${locale}/contacts`,
  });

  await sendEmail({ to: order.customerEmail, subject, html });
}

/**
 * PAID is special: unlike every later status, it also has real side
 * effects beyond notifying the customer — computing the platform's cut,
 * marking the painting SOLD so it drops out of the gallery, etc. Both
 * payment webhooks (Stripe, NOWPayments) call this instead of duplicating
 * that logic inline, which is what they did before this existed.
 */
export async function markOrderPaid(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status !== "PREVIEW") return; // already handled, or doesn't exist

  const amountEur = Number(order.amountEur);
  const platformCommissionEur = calculatePlatformCommissionEur(amountEur);
  const artistPayoutEur = calculateArtistPayoutEur(amountEur);

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID", platformCommissionEur, artistPayoutEur, paidAt: new Date() },
    }),
    // Only the existing painting leaves the shop. Prints and repainted copies
    // are made on demand, so they never change the painting's own status.
    ...order.items
      .filter((item) => item.variant === "ORIGINAL")
      .map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { status: "SOLD" },
        })
      ),
  ]);

  await notifyOrderStatus(orderId, "PAID");
}

interface AdvanceOptions {
  trackingNumber?: string;
  trackingCarrier?: string;
}

/**
 * Every status change after PAID goes through here — PAINTING, DRYING,
 * READY_TO_SHIP, SHIPPED (pass trackingNumber/trackingCarrier), and
 * DELIVERED. Whatever eventually triggers these (today: the admin API
 * route below; later: a real admin UI) should call this rather than
 * writing `prisma.order.update` directly, so the matching email never
 * gets missed.
 */
export async function advanceOrderStatus(orderId: string, status: EmailableStatus, options: AdvanceOptions = {}) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      ...(options.trackingNumber ? { trackingNumber: options.trackingNumber } : {}),
      ...(options.trackingCarrier ? { trackingCarrier: options.trackingCarrier } : {}),
    },
  });

  await notifyOrderStatus(orderId, status);
}
