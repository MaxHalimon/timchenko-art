import { getLocale, getTranslations } from "next-intl/server";
import { LEGAL_LAST_UPDATED } from "@/lib/constants";
import { AccentText } from "../AccentText/AccentText";
import styles from "./LegalPage.module.css";

interface Section {
  heading: string;
  body: string;
}

// How the shared "last updated" date is written per language. uk/de use the
// numeric DD.MM.YYYY form (01.10.2026); en/fr/ja spell out the month, because
// a bare 01.10.2026 reads as January 10th to an English-speaking visitor —
// same date, just unambiguous. Swap an entry for e.g. { day: "2-digit",
// month: "2-digit", year: "numeric" } if you want the numeric form there too.
const DATE_FORMATS: Record<string, { intl: string; options: Intl.DateTimeFormatOptions }> = {
  uk: { intl: "uk-UA", options: { day: "2-digit", month: "2-digit", year: "numeric" } },
  de: { intl: "de-DE", options: { day: "2-digit", month: "2-digit", year: "numeric" } },
  en: { intl: "en-GB", options: { dateStyle: "long" } },
  fr: { intl: "fr-FR", options: { dateStyle: "long" } },
  ja: { intl: "ja-JP", options: { dateStyle: "long" } },
};

function formatLegalDate(locale: string): string {
  const [y, m, d] = LEGAL_LAST_UPDATED.split("-").map(Number);
  const fmt = DATE_FORMATS[locale] ?? DATE_FORMATS.en;
  // Built and printed in UTC so the day never shifts with the server's timezone.
  return new Intl.DateTimeFormat(fmt.intl, { ...fmt.options, timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/**
 * Renders any `legal.<page>` translation namespace (privacyPolicy,
 * termsOfService, shippingPolicy, returnsRefunds, impressum — see messages/*.json)
 * as a title + intro + list of heading/body sections.
 *
 * Only the page-level title gets the AccentText treatment — section
 * headings stay plain, since decorative color-highlighting on every
 * subheading of a legal document would undercut how seriously it reads.
 *
 * ⚠️ Content in messages/*.json is a starting template, not finished legal
 * copy — the one remaining bracketed placeholder ([jurisdiction] in the
 * Terms) must be filled in (the "last updated" date is no longer a placeholder: it
 * comes from LEGAL_LAST_UPDATED in lib/constants.ts), and the whole set
 * should be reviewed by a lawyer before launch (see
 * prisma/PAINTINGS_GUIDE.md-style companion doc: LEGAL_PAGES_GUIDE.md).
 */
export async function LegalPage({ namespace }: { namespace: string }) {
  const t = await getTranslations(namespace);
  const locale = await getLocale();
  const sections = t.raw("sections") as Section[];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <AccentText text={t("title")} />
      </h1>
      <p className={styles.lastUpdated}>{t("lastUpdated", { date: formatLegalDate(locale) })}</p>
      <p className={styles.intro}>{t("intro")}</p>

      {sections.map((section, i) => (
        <section key={i} className={styles.section}>
          <h2 className={styles.heading}>{section.heading}</h2>
          <p className={styles.body}>{section.body}</p>
        </section>
      ))}
    </div>
  );
}
