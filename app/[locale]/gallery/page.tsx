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

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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

  const resolved = products.map((product) => ({
    slug: product.slug,
    title: localizedText(product.title, locale),
    previewImageUrl: product.previewImageKey,
    widthCm: product.widthCm,
    heightCm: product.heightCm,
    priceUsd: Number(product.priceUsd),
    status: product.status as ProductStatus,
  }));

  // "Стіна мистецтва" hero sample — drawn from the same (already filtered)
  // list exhibition mode uses, so clicking a hero tile can jump straight
  // to that painting's position in the slideshow. Capped at 9 per the
  // masonry brief; gracefully smaller if the filtered catalog has fewer.
  const heroPaintings = shuffle(resolved).slice(0, 9);

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
        defaultMode="exhibition"
      />
    </div>
  );
}
