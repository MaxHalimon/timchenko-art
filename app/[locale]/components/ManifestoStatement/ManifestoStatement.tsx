import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AccentText } from "../AccentText/AccentText";
import styles from "./ManifestoStatement.module.css";
import buttonStyles from "../shared/Buttons.module.css";

export function ManifestoStatement() {
  const t = useTranslations("hero");

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>{t("eyebrow")}</p>
      <h1 className={styles.title}>
        <AccentText text={t("title")} />
      </h1>
      <p className={styles.description}>{t("description")}</p>
      <Link href="/gallery" className={buttonStyles.galleryButton}>
        {t("cta")}
      </Link>
    </section>
  );
}
