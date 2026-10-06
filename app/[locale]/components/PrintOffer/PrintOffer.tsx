import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PRINT_DISPATCH_DAYS, PRINT_PRICE_EUR, PRINT_PRODUCTION_DAYS } from "@/lib/constants";
import { PriceTag } from "../PriceTag/PriceTag";
import { EaselButton } from "../EaselButton/EaselButton";
import styles from "./PrintOffer.module.css";

/**
 * The "canvas print" offer on a product page: a calm secondary card under the
 * description, so it's seen while a visitor is reading about the painting
 * without competing with the original's own price and button.
 *
 * When the original is SOLD the card turns into the main way forward
 * ("the original is sold — a print is still available"), so a sold painting
 * is a sales opportunity instead of a dead end.
 *
 * The standard-size print goes on the easel like any other piece (quantity is
 * set there). A different size has no fixed price, so that link opens the
 * contact form with the painting already named.
 */
export function PrintOffer({ slug, originalSold }: { slug: string; originalSold: boolean }) {
  const t = useTranslations("print");

  return (
    <aside className={originalSold ? `${styles.card} ${styles.cardHighlight}` : styles.card}>
      <div className={styles.top}>
        <h2 className={styles.heading}>{originalSold ? t("productSoldHeading") : t("productHeading")}</h2>
        <PriceTag amountEur={PRINT_PRICE_EUR} className={styles.price} />
      </div>
      <p className={styles.body}>{t("productBody", { days: PRINT_PRODUCTION_DAYS, dispatch: PRINT_DISPATCH_DAYS })}</p>
      <div className={styles.actions}>
        <EaselButton slug={slug} variant="print" />
        <Link href={`/contacts?print=${encodeURIComponent(slug)}&custom=1`} className={styles.link}>
          {t("otherSize")}
        </Link>
      </div>
    </aside>
  );
}
