import { getTranslations } from "next-intl/server";
import { ContactForm } from "../components/ContactForm/ContactForm";
import { SolidarityStatement } from "../components/SolidarityStatement/SolidarityStatement";
import styles from "./page.module.css";

const ARTIST_EMAIL = "m.tymchenko.art@gmail.com";

export default async function ContactsPage() {
  const t = await getTranslations("contact");

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("title")}</h1>

      <div className={styles.columns}>
        <div className={styles.formCard}>
          <h2 className={styles.columnHeading}>{t("formHeading")}</h2>
          <ContactForm />
        </div>

        <div className={styles.infoColumn}>
          <h2 className={styles.columnHeading}>{t("getInTouchHeading")}</h2>
          <p className={styles.intro}>{t("intro")}</p>

          <div className={styles.emailBlock}>
            <span className={styles.emailIcon} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <span className={styles.emailLabel}>{t("emailLabel")}</span>
              <a href={`mailto:${ARTIST_EMAIL}`} className={styles.emailLink}>
                {ARTIST_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </div>

      <SolidarityStatement />
    </div>
  );
}
