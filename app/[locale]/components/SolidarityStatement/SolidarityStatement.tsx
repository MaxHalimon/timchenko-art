import { useTranslations } from "next-intl";
import styles from "./SolidarityStatement.module.css";

/**
 * Placed on the /hello (contact) page rather than the homepage or the
 * shipping/tracking page: this is a values statement, and the "who we are /
 * how to reach us" page is where a visitor naturally expects to find it —
 * without disrupting the homepage's purely visual, immersive first screen,
 * or turning the transactional shipping page into something it isn't.
 *
 * The same policy is also stated as an operative Term of Service (see
 * legal.termsOfService.sections in messages/*.json) — this component is
 * the values/human framing, the Terms entry is the enforceable rule.
 */
export function SolidarityStatement() {
  const t = useTranslations("solidarity");

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{t("heading")}</h2>
      <p className={styles.body}>{t("body")}</p>
    </section>
  );
}
