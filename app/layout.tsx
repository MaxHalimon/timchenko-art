import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import "./[locale]/globals.css";
import { CURRENCY_COOKIE, SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { CurrencyProvider } from "./[locale]/providers/CurrencyProvider";
import { EaselProvider } from "./[locale]/providers/EaselProvider";
import { AmbientBackground } from "./[locale]/components/AmbientBackground/AmbientBackground";

/**
 * Deliberately minimal and locale-agnostic where possible. `<html>`/`<body>`
 * used to live inside `app/[locale]/layout.tsx`, which meant every locale
 * switch changed the value of the very segment that owns the document
 * root — Next.js can't patch that via client-side routing, so it fell
 * back to a full browser reload. Keeping them up here, above `[locale]`,
 * lets locale changes be a normal soft navigation.
 *
 * `EaselProvider`/`CurrencyProvider`/`AmbientBackground` are hoisted up
 * here too, for the same underlying reason: ANY layout.tsx physically
 * inside the `[locale]` folder is remounted by Next.js whenever the
 * locale segment's value changes — by design, confirmed intended
 * behavior (see vercel/next.js#44793) — regardless of whether that layout
 * reads the param itself. Cart contents and the chosen currency would
 * otherwise visibly flash/re-hydrate on every language switch. They don't
 * need translated text, so they can safely live above
 * `NextIntlClientProvider` (which must stay inside `[locale]`, since the
 * loaded messages themselves depend on that segment's value).
 *
 * The header/nav, age gate, and footer still remount on a locale switch —
 * they need translated strings, which requires being below
 * `NextIntlClientProvider`, which requires being inside `[locale]`. That's
 * an inherent trade-off of keeping human-readable, SEO-friendly
 * `/uk/...`, `/en/...` URLs with next-intl's standard per-locale message
 * loading — not something a rewire of these two files can avoid.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  // Same cookie read that used to happen in [locale]/layout.tsx — moved
  // up here since CurrencyProvider now lives at this level.
  const cookieStore = await cookies();
  const cookieCurrency = cookieStore.get(CURRENCY_COOKIE)?.value as CurrencyCode | undefined;
  const initialCurrency: CurrencyCode = SUPPORTED_CURRENCIES.includes(cookieCurrency as CurrencyCode)
    ? (cookieCurrency as CurrencyCode)
    : "USD";

  return (
    <html lang={locale}>
      <body>
        <CurrencyProvider initialCurrency={initialCurrency}>
          <EaselProvider>
            <AmbientBackground />
            {children}
          </EaselProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
