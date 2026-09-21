import { locales, type Locale } from "@/i18n/config";

/**
 * Cookie next-intl's middleware itself reads/writes to remember a
 * visitor's locale (this is next-intl's own default cookie name, not one
 * we invented — see LOCALE_COOKIE usage in middleware.ts for why that
 * matters). If a `localeCookie` option is ever added to the
 * `createMiddleware` call in middleware.ts, update this to match.
 */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Country (ISO 3166-1 alpha-2) → storefront locale. Mirrors
 * COUNTRY_TO_CURRENCY in lib/currency.ts in spirit: only covers countries
 * that clearly map to one of this site's 5 languages; everything else
 * (IT, ES, NL, PL, and any country not listed at all) falls back to "en"
 * — English is the deliberate default for a country whose language isn't
 * one of the site's, even though the *site's own* structural fallback
 * (`defaultLocale` in i18n/config.ts) is "uk" for unrelated technical
 * reasons (malformed locale segments, etc.). Don't conflate the two.
 */
export const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  UA: "uk",
  DE: "de",
  AT: "de",
  CH: "de",
  LI: "de",
  FR: "fr",
  MC: "fr",
  JP: "ja",
  // Explicit rather than relying on the fallback, so this reads as an
  // intentional choice and survives someone later changing the fallback.
  GB: "en",
  US: "en",
  CA: "en",
  AU: "en",
  IE: "en",
  NZ: "en",
};

export function localeForCountry(countryCode: string | undefined): Locale {
  if (!countryCode) return "en";
  const mapped = COUNTRY_TO_LOCALE[countryCode.toUpperCase()];
  return mapped && locales.includes(mapped) ? mapped : "en";
}
