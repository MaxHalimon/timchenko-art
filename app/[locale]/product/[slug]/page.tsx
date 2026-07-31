import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { localizedText } from "@/lib/localizedText";
import { Link } from "@/i18n/navigation";
import { PriceTag } from "../../components/PriceTag/PriceTag";
import { EaselButton } from "../../components/EaselButton/EaselButton";
import { AccentText } from "../../components/AccentText/AccentText";
import { ProductCarousel } from "../../components/ProductCarousel/ProductCarousel";
import type { ProductStatus } from "../../components/ProductCard/ProductCard";
import styles from "./page.module.css";

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const STATUS_BADGE_CLASS: Record<ProductStatus, string> = {
  AVAILABLE: styles.statusAvailable,
  IN_PROGRESS: styles.statusInProgress,
  SOLD: styles.statusSold,
};

async function getProduct(slug: string) {
  return prisma.product.findUnique({ where: { slug } });
}

/**
 * A handful of other pieces to show under "You might also like" — same
 * theme first (most relevant), topped up with the most recent other
 * pieces if the theme alone doesn't yield enough. Sold pieces are left
 * out since they can't be added to the easel anyway.
 */
async function getRelatedProducts(product: { id: string; theme: string | null }) {
  const sameTheme = product.theme
    ? await prisma.product.findMany({
        where: { theme: product.theme, id: { not: product.id }, status: { not: "SOLD" } },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
    : [];

  if (sameTheme.length >= 4) return sameTheme;

  const fillers = await prisma.product.findMany({
    where: {
      id: { notIn: [product.id, ...sameTheme.map((p) => p.id)] },
      status: { not: "SOLD" },
    },
    orderBy: { createdAt: "desc" },
    take: 8 - sameTheme.length,
  });

  return [...sameTheme, ...fillers];
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const product = await getProduct(slug);

  if (!product) return {};

  return {
    title: `${localizedText(product.title, locale)} — Timchenko Art`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, locale } = await params;
  const [t, tCard, product] = await Promise.all([
    getTranslations("product"),
    getTranslations("productCard"),
    getProduct(slug),
  ]);

  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const isSold = product.status === "SOLD";
  const status = product.status as ProductStatus;
  const title = localizedText(product.title, locale);

  return (
    <div className={styles.page}>
      <Link href="/gallery" className={styles.backLink}>
        {t("backToGallery")}
      </Link>

      <div className={styles.layout}>
        <div className={styles.imageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.previewImageKey}
            alt={title}
            className={isSold ? `${styles.image} ${styles.imageSold}` : styles.image}
          />
          <span className={`${styles.statusBadge} ${STATUS_BADGE_CLASS[status]}`}>{tCard(`status.${status}`)}</span>
        </div>

        <div className={styles.info}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.meta}>
            {tCard("dimensions", { width: product.widthCm, height: product.heightCm })} · {tCard("material")}
          </p>

          <div className={styles.priceRow}>
            <PriceTag amountUsd={Number(product.priceUsd)} className={styles.price} />
            <EaselButton slug={product.slug} disabled={isSold} />
          </div>

          {product.description && (
            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>{t("descriptionHeading")}</h2>
              <p className={styles.description}>{product.description}</p>
            </section>
          )}

          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>{t("detailsHeading")}</h2>
            <dl className={styles.detailsList}>
              <div className={styles.detailRow}>
                <dt>{t("dimensionsLabel")}</dt>
                <dd>{tCard("dimensions", { width: product.widthCm, height: product.heightCm })}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>{t("materialLabel")}</dt>
                <dd>{product.material}</dd>
              </div>
              {product.theme && (
                <div className={styles.detailRow}>
                  <dt>{t("themeLabel")}</dt>
                  <dd>{product.theme}</dd>
                </div>
              )}
              <div className={styles.detailRow}>
                <dt>{t("statusLabel")}</dt>
                <dd>{tCard(`status.${status}`)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section className={styles.relatedSection}>
          <h2 className={styles.relatedHeading}>
            <AccentText text={t("relatedHeading")} />
          </h2>
          <ProductCarousel
            products={related.map((p) => ({
              slug: p.slug,
              title: localizedText(p.title, locale),
              previewImageUrl: p.previewImageKey,
              widthCm: p.widthCm,
              heightCm: p.heightCm,
              priceUsd: Number(p.priceUsd),
              status: p.status as ProductStatus,
            }))}
          />
        </section>
      )}
    </div>
  );
}
