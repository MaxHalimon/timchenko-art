import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import buttonStyles from "../../components/shared/Buttons.module.css";
import styles from "./not-found.module.css";

export default async function ProductNotFound() {
  const t = await getTranslations("product");

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("notFoundTitle")}</h1>
      <p className={styles.body}>{t("notFoundBody")}</p>
      <Link href="/gallery" className={buttonStyles.galleryButton}>
        {t("notFoundCta")}
      </Link>
    </div>
  );
}
