import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./HeroSection.module.css";
import buttonStyles from "../shared/Buttons.module.css";

interface HeroSectionProps {
  featuredImageUrl?: string;
  featuredImageAlt?: string;
}

export function HeroSection({
  featuredImageUrl = "/hero-placeholder.jpg",
  featuredImageAlt = "Featured oil painting on canvas",
}: HeroSectionProps) {
  const t = useTranslations("hero");

  return (
    <section className={styles.heroSection}>
      <div>
        <p className={styles.eyebrow}>{t("eyebrow")}</p>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.description}>{t("description")}</p>
        <Link href="/catalog" className={buttonStyles.catalogButton}>
          {t("cta")}
        </Link>
      </div>

      <div className={styles.imageFrame}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={featuredImageUrl} alt={featuredImageAlt} className={styles.image} />
      </div>
    </section>
  );
}
