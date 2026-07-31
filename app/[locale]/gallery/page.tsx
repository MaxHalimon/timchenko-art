import { getTranslations } from "next-intl/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { localizedText } from "@/lib/localizedText";
import { ProductCard, type ProductStatus } from "../components/ProductCard/ProductCard";
import { FilterBar } from "./FilterBar";
import { AccentText } from "../components/AccentText/AccentText";
import styles from "./page.module.css";

// Size buckets used for filtering — matches on the painting's larger side.
// Labels come from translations (gallery.filters.size*), this only carries
// the numeric ranges. Every entry has the same shape (min + max) so
// TypeScript doesn't see this as a union of incompatible object types.
const SIZE_BUCKETS: Record<"small" | "medium" | "large", { min: number; max: number | null }> = {
  small: { min: 0, max: 50 },
  medium: { min: 50, max: 80 },
  large: { min: 80, max: null },
};

type SizeBucket = keyof typeof SIZE_BUCKETS;

interface GallerySearchParams {
  size?: SizeBucket;
  theme?: string;
  status?: ProductStatus;
}

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<GallerySearchParams>;
}) {
  const { locale } = await params;
  const { size, theme, status } = await searchParams;
  const t = await getTranslations("gallery");

  const where: Prisma.ProductWhereInput = {};

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
        widthCm: { gte: bucket.min, ...(bucket.max ? { lte: bucket.max } : {}) },
      },
      {
        heightCm: { gte: bucket.min, ...(bucket.max ? { lte: bucket.max } : {}) },
      },
    ];
  }

  const [products, themes] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    // Distinct themes for the filter dropdown — cheap enough to run inline
    // at this gallery size; move to a cached query if the catalog grows large.
    prisma.product.findMany({
      distinct: ["theme"],
      select: { theme: true },
      where: { theme: { not: null } },
    }),
  ]);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>
        <AccentText text={t("heading")} />
      </h1>
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
              title={localizedText(product.title, locale)}
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
