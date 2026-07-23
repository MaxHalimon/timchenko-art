import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  const t = useTranslations("common");
  const tLegal = useTranslations("legal");

  return (
    <footer className={styles.footer}>
      <nav className={styles.legalNav}>
        <Link href="/privacy-policy">{tLegal("privacyPolicy.title")}</Link>
        <Link href="/terms-of-service">{tLegal("termsOfService.title")}</Link>
        <Link href="/shipping-policy">{tLegal("shippingPolicy.title")}</Link>
        <Link href="/returns-refunds">{tLegal("returnsRefunds.title")}</Link>
      </nav>
      <p className={styles.copyright}>
        © {new Date().getFullYear()} {t("siteName")}. {t("footer")}
      </p>
    </footer>
  );
}
