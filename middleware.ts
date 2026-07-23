import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "./i18n/config";
import { currencyForCountry, CURRENCY_COOKIE } from "./lib/currency";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always", // /uk/..., /en/..., /de/... — explicit is clearer for a multi-language storefront
});

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // Only set an initial currency guess if the visitor hasn't chosen one
  // manually yet — a manual choice is written to this same cookie by
  // CurrencySwitcher and always takes priority over the geo guess.
  if (!request.cookies.get(CURRENCY_COOKIE)) {
    // Vercel populates this header automatically in production deploys.
    // It's absent when running locally / on other hosts, in which case
    // we fall back to USD — swap in a geo-IP lookup there if needed.
    const country = request.headers.get("x-vercel-ip-country") ?? undefined;
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
