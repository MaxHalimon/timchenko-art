import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { locales, defaultLocale, type Locale } from "./i18n/config";
import { currencyForCountry, CURRENCY_COOKIE } from "./lib/currency";
import { localeForCountry, LOCALE_COOKIE } from "./lib/geoLocale";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always", // /uk/..., /en/..., /de/... — explicit is clearer for a multi-language storefront
});

export default function middleware(request: NextRequest) {
  const country = request.headers.get("x-vercel-ip-country") ?? undefined;
  const hasChosenLocale = request.cookies.has(LOCALE_COOKIE);

  let effectiveRequest = request;
  let geoLocale: Locale | undefined;

  if (!hasChosenLocale) {
    // First visit (or cookies cleared) and no locale segment worth
    // trusting yet — steer next-intl's own detection toward the
    // visitor's geo-derived locale by injecting the cookie it already
    // looks for (NEXT_LOCALE), rather than reimplementing its
    // Accept-Language/redirect logic ourselves. Once the visitor picks a
    // language manually (LanguageSwitcher navigates to that locale),
    // next-intl writes this same cookie itself and it always wins after
    // that — this only ever fires on a visitor's first touch.
    geoLocale = localeForCountry(country);
    const headers = new Headers(request.headers);
    const existingCookie = headers.get("cookie") ?? "";
    headers.set("cookie", existingCookie ? `${existingCookie}; ${LOCALE_COOKIE}=${geoLocale}` : `${LOCALE_COOKIE}=${geoLocale}`);
    effectiveRequest = new NextRequest(request.nextUrl, { headers, method: request.method });
  }

  const response = intlMiddleware(effectiveRequest);

  if (geoLocale) {
    response.cookies.set(LOCALE_COOKIE, geoLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  // Only set an initial currency guess if the visitor hasn't chosen one
  // manually yet — a manual choice is written to this same cookie by
  // CurrencySwitcher and always takes priority over the geo guess.
  if (!request.cookies.get(CURRENCY_COOKIE)) {
    // Vercel populates this header automatically in production deploys.
    // It's absent when running locally / on other hosts, in which case
    // we fall back to EUR (the site's base currency) — swap in a geo-IP
    // lookup there if needed.
    response.cookies.set(CURRENCY_COOKIE, currencyForCountry(country), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  // Run on every path except API routes, Next internals, and static files.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
