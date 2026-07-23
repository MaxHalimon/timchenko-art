import { getTranslations } from "next-intl/server";
import styles from "./LegalPage.module.css";

interface Section {
  heading: string;
  body: string;
}

/**
 * Renders any `legal.<page>` translation namespace (privacyPolicy,
 * termsOfService, shippingPolicy, returnsRefunds — see messages/*.json)
 * as a title + intro + list of heading/body sections.
 *
 * ⚠️ Content in messages/*.json is a starting template, not finished legal
 * copy — bracketed placeholders like [дата]/[date]/[Datum]/[日付] and
 * [contact email]/[jurisdiction] must be filled in, and the whole set
 * should be reviewed by a lawyer before launch (see
 * prisma/PAINTINGS_GUIDE.md-style companion doc: LEGAL_PAGES_GUIDE.md).
 */
export async function LegalPage({ namespace }: { namespace: string }) {
  const t = await getTranslations(namespace);
  const sections = t.raw("sections") as Section[];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.lastUpdated}>{t("lastUpdated")}</p>
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
