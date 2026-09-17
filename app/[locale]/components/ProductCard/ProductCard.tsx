import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PriceTag } from "../PriceTag/PriceTag";
import { EaselButton } from "../EaselButton/EaselButton";
import styles from "./ProductCard.module.css";

// Mirrors the Prisma `ProductStatus` enum exactly — keep these two in sync.
export type ProductStatus = "AVAILABLE" | "IN_PROGRESS" | "SOLD";

const STATUS_CLASS: Record<ProductStatus, string> = {
  AVAILABLE: styles.statusAvailable,
  IN_PROGRESS: styles.statusInProgress,
  SOLD: styles.statusSold,
};

export interface ProductCardProps {
  slug: string;
  title: string;
  previewImageUrl: string; // watermarked preview only — never the original asset
  widthCm: number;
  heightCm: number;
  priceEur: number;
  status: ProductStatus;
  /** Stable slug into productCard.materials.* — see messages/*.json. */
  material: string;
}

export function ProductCard({
  slug,
  title,
  previewImageUrl,
  widthCm,
  heightCm,
  priceEur,
  status,
  material,
}: ProductCardProps) {
  const t = useTranslations("productCard");
  const isSold = status === "SOLD";

  return (
    <div className={styles.card}>
      <Link href={`/product/${slug}`}>
        <div className={styles.imageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImageUrl}
            alt={title}
            className={isSold ? `${styles.image} ${styles.imageSold}` : styles.image}
          />
          <span className={`${styles.statusBadge} ${STATUS_CLASS[status]}`}>{t(`status.${status}`)}</span>
        </div>

        <div className={styles.body}>
          <h3 className={styles.productTitle}>{title}</h3>
          <p className={styles.meta}>
            {t("dimensions", { width: widthCm, height: heightCm })} · {t(`materials.${material}`)}
          </p>
        </div>
      </Link>

      <div className={styles.actions}>
        <PriceTag amountEur={priceEur} className={styles.price} />
        <EaselButton slug={slug} />
      </div>
    </div>
  );
}
