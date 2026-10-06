import type { OrderItemVariant } from "@prisma/client";
import { localizedText } from "./localizedText";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import uk from "@/messages/uk.json";
import en from "@/messages/en.json";
import de from "@/messages/de.json";
import fr from "@/messages/fr.json";
import ja from "@/messages/ja.json";

/**
 * Server-side wording for order lines (Stripe line items, NOWPayments
 * description, e-mails). Read straight from messages/*.json -> "orderItem" so
 * a translation is edited in one place and the site and the e-mails agree.
 */
const LABELS: Record<Locale, Record<OrderItemVariant, string>> = {
  uk: uk.orderItem.variant,
  en: en.orderItem.variant,
  de: de.orderItem.variant,
  fr: fr.orderItem.variant,
  ja: ja.orderItem.variant,
};

export function variantLabel(locale: string, variant: OrderItemVariant): string {
  const safe = (locales as readonly string[]).includes(locale) ? (locale as Locale) : defaultLocale;
  return LABELS[safe][variant];
}

/** "Orange - original, oil on canvas" / "Orange x2 - canvas print" */
export function describeItem(locale: string, title: string, variant: OrderItemVariant, quantity: number): string {
  return `${title}${quantity > 1 ? ` \u00d7${quantity}` : ""} \u2014 ${variantLabel(locale, variant)}`;
}

interface ItemWithProduct {
  variant: OrderItemVariant;
  quantity: number;
  product: { title: unknown };
}

/** One readable line per order row, in the customer's language. */
export function summarizeItems(locale: string, items: ItemWithProduct[]): string[] {
  return items.map((item) => describeItem(locale, localizedText(item.product.title, locale), item.variant, item.quantity));
}

/** "Orange" or "Orange +2" - for e-mail subjects, where a full list is too long. */
export function subjectTitle(locale: string, items: ItemWithProduct[]): string {
  const titles = Array.from(new Set(items.map((item) => localizedText(item.product.title, locale))));
  return titles.length <= 1 ? (titles[0] ?? "") : `${titles[0]} +${titles.length - 1}`;
}

/**
 * An order made only of canvas prints has no painting / drying stages, so its
 * tracking timeline and e-mails use "in production" instead.
 */
export function isPrintOnly(items: { variant: OrderItemVariant }[]): boolean {
  return items.length > 0 && items.every((item) => item.variant === "PRINT");
}
