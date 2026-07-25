/**
 * Currency support. Base currency for all stored prices (Product.priceUsd,
 * Order.amountUsd) stays USD — this module only concerns *display*
 * conversion and, eventually, checkout currency.
 *
 * IMPORTANT: EXCHANGE_RATES below are static placeholders, not live rates.
 * Before going live, wire this up to a real feed (e.g. exchangerate-api.com,
 * openexchangerates.org) and cache/refresh it periodically — do not ship
 * hardcoded rates to production.
 */

export const SUPPORTED_CURRENCIES = ["USD", "UAH", "EUR", "GBP", "JPY"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

/** Cookie shared between middleware (initial geo guess) and the client-side
 * CurrencySwitcher (manual override) — same key, single source of truth. */
export const CURRENCY_COOKIE = "timchenko-art-currency";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  UAH: "₴",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

/** Placeholder rates, USD base. Replace with a live feed before launch. */
export const EXCHANGE_RATES_FROM_USD: Record<CurrencyCode, number> = {
  USD: 1,
  UAH: 41.5,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 157,
};

/**
 * Country (ISO 3166-1 alpha-2) → default currency. Only covers the
 * countries relevant to this storefront's languages/markets; anything
 * else falls back to USD.
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
  if (!countryCode) return "USD";
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] ?? "USD";
}

export function convertFromUsd(amountUsd: number, currency: CurrencyCode): number {
  return amountUsd * EXCHANGE_RATES_FROM_USD[currency];
}

export function formatPrice(amountUsd: number, currency: CurrencyCode): string {
  const converted = convertFromUsd(amountUsd, currency);
  // UAH and JPY are conventionally shown with no decimals; everything else uses 2.
  const decimals = currency === "UAH" || currency === "JPY" ? 0 : 2;
  return `${CURRENCY_SYMBOLS[currency]}${converted.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
