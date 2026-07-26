import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TrackingForm } from "../components/TrackingForm/TrackingForm";
import { AccentText } from "../components/AccentText/AccentText";
import styles from "./page.module.css";

export default async function TrackingPage() {
  const t = await getTranslations("tracking");

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <AccentText text={t("title")} />
      </h1>
      <p className={styles.intro}>{t("intro")}</p>

      <TrackingForm />

      <div className={styles.filler}>
        <h2 className={styles.fillerHeading}>
          <AccentText text={t("fillerHeading")} />
        </h2>
        <p className={styles.fillerText}>
          {t("fillerText")}{" "}
          <Link href="/shipping-policy" className={styles.fillerLink}>
            {t("fillerLinkText")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
