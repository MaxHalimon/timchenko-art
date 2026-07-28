import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import "./globals.css";
import { locales, type Locale } from "@/i18n/config";
import { CURRENCY_COOKIE, SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { CurrencyProvider } from "./providers/CurrencyProvider";
import { EaselProvider } from "./providers/EaselProvider";
import { AgeGate } from "./components/AgeGate/AgeGate";
import { SiteHeaderSwitch } from "./components/SiteHeaderSwitch/SiteHeaderSwitch";
import { SiteFooter } from "./components/SiteFooter/SiteFooter";
import { BackToTop } from "./components/BackToTop/BackToTop";
import { AmbientBackground } from "./components/AmbientBackground/AmbientBackground";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Keeps the whole site out of search engines until launch — flip
// NEXT_PUBLIC_ALLOW_INDEXING to "true" in .env (and on Vercel) when ready
// to go live. Needed right now because the age gate isn't enforced
// server-side for every region yet, and an indexed-too-early site risks
// being flagged/blocked before that's sorted out.
const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export const metadata: Metadata = {
  title: "Timchenko Art",
  description: "Hand-painted oil paintings by Marina — from the catalog or made to order.",
  robots: ALLOW_INDEXING ? undefined : { index: false, follow: false },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  // Middleware already set this cookie (geo guess or a prior manual choice)
  // before this request ever reached a page — read it here so the very
  // first server-rendered paint already shows the right currency, no flash.
  const cookieStore = await cookies();
  const cookieCurrency = cookieStore.get(CURRENCY_COOKIE)?.value as CurrencyCode | undefined;
  const initialCurrency: CurrencyCode = SUPPORTED_CURRENCIES.includes(cookieCurrency as CurrencyCode)
    ? (cookieCurrency as CurrencyCode)
    : "USD";

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <CurrencyProvider initialCurrency={initialCurrency}>
            <EaselProvider>
              <AmbientBackground />
              {/* Blocks interaction until the visitor confirms they are 18+.
                  State is persisted client-side (see AgeGate.tsx). */}
              <AgeGate />
              <SiteHeaderSwitch />
              <main>{children}</main>
              <SiteFooter />
              <BackToTop />
            </EaselProvider>
          </CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
