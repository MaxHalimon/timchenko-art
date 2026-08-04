import { getTranslations } from "next-intl/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { localizedText } from "@/lib/localizedText";
import { AccentText } from "../components/AccentText/AccentText";
import { GalleryView } from "./GalleryView";
import type { ProductStatus } from "../components/ProductCard/ProductCard";
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

const HERO_POOL_SIZE = 8;

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

  const [products, themes, heroRows] = await Promise.all([
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
    // Hero "greeting" strip — deliberately its OWN query, completely
    // independent of the filters above (a fresh random sample every load,
    // regardless of what's selected in FilterBar). ORDER BY RANDOM() runs
    // in Postgres itself rather than shuffling the whole table in JS, so
    // this stays cheap even once the catalog is at the ~200-painting scale.
    prisma.$queryRaw<Array<{ slug: string; title: Prisma.JsonValue; previewImageKey: string }>>`
      SELECT "slug", "title", "previewImageKey" FROM "products" ORDER BY RANDOM() LIMIT ${HERO_POOL_SIZE}
    `,
  ]);

  const resolved = products.map((product) => ({
    slug: product.slug,
    title: localizedText(product.title, locale),
    previewImageUrl: product.previewImageKey,
    widthCm: product.widthCm,
    heightCm: product.heightCm,
    priceUsd: Number(product.priceUsd),
    status: product.status as ProductStatus,
  }));

  const heroPaintings = heroRows.map((row) => ({
    slug: row.slug,
    title: localizedText(row.title, locale),
    previewImageUrl: row.previewImageKey,
  }));

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>
        <AccentText text={t("heading")} />
      </h1>

      <GalleryView
        products={resolved}
        heroPaintings={heroPaintings}
        themeOptions={themes.map((th) => th.theme!).filter(Boolean)}
        current={{ size, theme, status }}
      />
    </div>
  );
}
