import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AccentText } from "../AccentText/AccentText";
import buttonStyles from "../shared/Buttons.module.css";
import styles from "./ArtistIntro.module.css";

interface FeatureItem {
  label: string;
  text: string;
}

export async function ArtistIntro() {
  const t = await getTranslations("artistIntro");
  const tHero = await getTranslations("hero");
  const paragraphs = t.raw("paragraphs") as string[];
  const features = t.raw("features") as FeatureItem[];
  const whyBuy = t.raw("whyBuy") as FeatureItem[];

  return (
    <section className={styles.section} data-last-section="artist-intro">
      <h2 className={styles.heading}>
        <AccentText text={t("heading")} />
      </h2>

      {paragraphs.map((paragraph, i) => (
        <p key={i} className={styles.paragraph}>
          {paragraph}
        </p>
      ))}

      <h3 className={styles.subheading}>
        <AccentText text={t("featuresHeading")} />
      </h3>
      <ul className={styles.list}>
        {features.map((feature, i) => (
          <li key={i} className={styles.listItem}>
            <span className={styles.listLabel}>{feature.label}:</span> {feature.text}
          </li>
        ))}
      </ul>

      <p className={styles.exhibitions}>{t("exhibitions")}</p>

      <h3 className={styles.subheading}>
        <AccentText text={t("whyBuyHeading")} />
      </h3>
      <ul className={styles.list}>
        {whyBuy.map((item, i) => (
          <li key={i} className={styles.listItem}>
            <span className={styles.listLabel}>{item.label}:</span> {item.text}
          </li>
        ))}
      </ul>

      <p className={styles.closing}>{t("closing")}</p>

      <Link href="/gallery" className={`${buttonStyles.galleryButton} ${styles.endCta}`}>
        {tHero("cta")}
      </Link>
    </section>
  );
}
