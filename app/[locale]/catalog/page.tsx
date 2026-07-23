import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ProductCard, type ProductStatus } from "../components/ProductCard/ProductCard";
import { FilterBar } from "./FilterBar";
import styles from "./page.module.css";

// Size buckets used for filtering — matches on the painting's larger side.
// Labels come from translations (catalog.filters.size*), this only carries
// the numeric ranges.
const SIZE_BUCKETS = {
  small: { max: 50 },
  medium: { min: 50, max: 80 },
  large: { min: 80 },
} as const;

type SizeBucket = keyof typeof SIZE_BUCKETS;

interface CatalogSearchParams {
  size?: SizeBucket;
  theme?: string;
  status?: ProductStatus;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { size, theme, status } = await searchParams;
  const t = await getTranslations("catalog");

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (theme) {
    where.theme = theme;
  }

  if (size && SIZE_BUCKETS[size]) {
    const bucket = SIZE_BUCKETS[size];
    // Filter on whichever dimension is the larger one, so a 40×90 painting
    // still shows up under "over 80cm".
    where.OR = [
      {
        widthCm: { gte: bucket.min ?? 0, ...(bucket.max ? { lte: bucket.max } : {}) },
      },
      {
        heightCm: { gte: bucket.min ?? 0, ...(bucket.max ? { lte: bucket.max } : {}) },
      },
    ];
  }

  const [products, themes] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    // Distinct themes for the filter dropdown — cheap enough to run inline
    // at this catalog size; move to a cached query if the catalog grows large.
    prisma.product.findMany({
      distinct: ["theme"],
      select: { theme: true },
      where: { theme: { not: null } },
    }),
  ]);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>{t("heading")}</h1>
      <p className={styles.count}>{t("count", { count: products.length })}</p>

      <FilterBar
        themeOptions={themes.map((th) => th.theme!).filter(Boolean)}
        current={{ size, theme, status }}
      />

      {products.length === 0 ? (
        <p className={styles.empty}>{t("empty")}</p>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              slug={product.slug}
              title={product.title}
              previewImageUrl={product.previewImageKey}
              widthCm={product.widthCm}
              heightCm={product.heightCm}
              priceUsd={Number(product.priceUsd)}
              status={product.status as ProductStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
