import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AccentText } from "../../../components/AccentText/AccentText";
import { ClearEasel } from "../../../components/ClearEasel/ClearEasel";
import buttonStyles from "../../../components/shared/Buttons.module.css";
import styles from "./page.module.css";

// Never worth indexing — it's a per-customer confirmation screen.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Where Stripe and NOWPayments send the customer after paying (see
 * success_url in app/api/orders/route.ts). Intentionally does NOT read the
 * order from the database: the real payment confirmation arrives through the
 * webhooks (app/api/webhooks/*), which can land a few seconds after the
 * redirect, so this page only thanks the customer, shows the order number
 * from the URL, and hands them to the Order Status page for live progress.
 */
export default async function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("orderSuccess");

  return (
    <div className={styles.page}>
      <ClearEasel />

      <h1 className={styles.title}>
        <AccentText text={t("title")} />
      </h1>
      <p className={styles.intro}>{t("intro")}</p>

      <div className={styles.orderBox}>
        <p className={styles.orderLabel}>{t("orderNumberLabel")}</p>
        <p className={styles.orderNumber}>{id}</p>
        <p className={styles.orderHint}>{t("orderNumberHint")}</p>
      </div>

      <div className={styles.actions}>
        <Link href={`/tracking?ref=${encodeURIComponent(id)}`} className={buttonStyles.galleryButton}>
          {t("trackButton")}
        </Link>
        <Link href="/gallery" className={styles.galleryLink}>
          {t("galleryLink")}
        </Link>
      </div>
    </div>
  );
}
