import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { AgeGate } from "./components/AgeGate/AgeGate";
import { SiteHeaderSwitch } from "./components/SiteHeaderSwitch/SiteHeaderSwitch";
import { SiteFooter } from "./components/SiteFooter/SiteFooter";
import { BackToTop } from "./components/BackToTop/BackToTop";
import { HtmlLangSync } from "./components/HtmlLangSync/HtmlLangSync";

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

/**
 * Everything here — header/nav, age gate, footer — needs translated text,
 * which means it must sit below NextIntlClientProvider, which means it
 * must sit inside this `[locale]` segment. That in turn means all of it
 * remounts on a locale switch (see app/layout.tsx for why). Cart state,
 * currency, and the decorative background live one level up specifically
 * to avoid being part of that remount.
 */
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

  return (
    <NextIntlClientProvider messages={messages}>
      <HtmlLangSync locale={locale} />
      {/* Blocks interaction until the visitor confirms they are 18+.
          State is persisted client-side (see AgeGate.tsx). */}
      <AgeGate />
      <SiteHeaderSwitch />
      <main>{children}</main>
      <SiteFooter />
      <BackToTop />
    </NextIntlClientProvider>
  );
}
