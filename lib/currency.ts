/**
 * Currency support. Base currency for all stored prices (Product.priceEur,
 * Order.amountEur) is EUR — the artist sets and thinks in EUR, so that's
 * the single source of truth. This module only concerns *display*
 * conversion (and checkout currency, which also runs in EUR).
 *
 * IMPORTANT: EXCHANGE_RATES below are static placeholders, not live rates.
 * Before going live, wire this up to a real feed (e.g. exchangerate-api.com,
 * openexchangerates.org) and cache/refresh it periodically — do not ship
 * hardcoded rates to production.
 */

export const SUPPORTED_CURRENCIES = ["EUR", "USD", "UAH", "GBP", "JPY"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

/** Cookie shared between middleware (initial geo guess) and the client-side
 * CurrencySwitcher (manual override) — same key, single source of truth. */
export const CURRENCY_COOKIE = "timchenko-art-currency";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  EUR: "€",
  USD: "$",
  UAH: "₴",
  GBP: "£",
  JPY: "¥",
};

/** Placeholder rates, EUR base. Replace with a live feed before launch. */
export const EXCHANGE_RATES_FROM_EUR: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 1.14,
  UAH: 45.7,
  GBP: 0.87,
  JPY: 172.5,
};

/**
 * Country (ISO 3166-1 alpha-2) → default currency. Only covers the
 * countries relevant to this storefront's languages/markets; anything
 * else falls back to EUR, the site's base/home currency.
 */
export const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  UA: "UAH",
  DE: "EUR",
  AT: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  PL: "EUR",
  GB: "GBP",
  US: "USD",
  JP: "JPY",
};

export function currencyForCountry(countryCode: string | undefined): CurrencyCode {
  if (!countryCode) return "EUR";
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] ?? "EUR";
}

export function convertFromEur(amountEur: number, currency: CurrencyCode): number {
  return amountEur * EXCHANGE_RATES_FROM_EUR[currency];
}

export function formatPrice(amountEur: number, currency: CurrencyCode): string {
  const converted = convertFromEur(amountEur, currency);
  // UAH and JPY are conventionally shown with no decimals; everything else uses 2.
  const decimals = currency === "UAH" || currency === "JPY" ? 0 : 2;
  return `${CURRENCY_SYMBOLS[currency]}${converted.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
