import { getTranslations } from "next-intl/server";
import { ContactForm } from "../components/ContactForm/ContactForm";
import { SolidarityStatement } from "../components/SolidarityStatement/SolidarityStatement";
import styles from "./page.module.css";

const ARTIST_EMAIL = "m.tymchenko.art@gmail.com";

export default async function HelloPage() {
  const t = await getTranslations("contact");

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.intro}>{t("intro")}</p>

      <p className={styles.emailRow}>
        <span className={styles.emailLabel}>{t("emailLabel")}</span>
        <a href={`mailto:${ARTIST_EMAIL}`} className={styles.emailLink}>
          {ARTIST_EMAIL}
        </a>
      </p>

      <ContactForm />

      <SolidarityStatement />
    </div>
  );
}
