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
  /** Set by "переглянути в галереї" links (FocusCardModal, product
   *  page, etc.) — the hero marquee shows every painting on the site,
   *  so the target is always already in it; this just tells GalleryHero
   *  which one to center + highlight on arrival. */
  focus?: string;
}

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<GallerySearchParams>;
}) {
  const { locale } = await params;
  const { size, theme, status, focus } = await searchParams;
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
    // independent of the filters above (this always shows the full
    // catalog regardless of what's selected in FilterBar, and naturally
    // stays current as paintings sell or new ones are added — it's just
    // a fresh query on every load, nothing cached/hardcoded). ORDER BY
    // RANDOM() still shuffles the display order each visit; there's no
    // LIMIT here on purpose — see GalleryHero's own comment for the
    // client-side implications of that (lazy-loaded images, etc.).
    prisma.$queryRaw<
      Array<{
        slug: string;
        title: Prisma.JsonValue;
        previewImageKey: string;
        widthCm: number;
        heightCm: number;
        material: string;
        // Raw queries don't go through Prisma's normal Decimal mapping —
        // could come back as a string or number depending on driver
        // version, so this is typed loosely and pushed through Number()
        // below regardless.
        priceEur: number | string;
      }>
    >`
      SELECT "slug", "title", "previewImageKey", "widthCm", "heightCm", "material", "priceEur"
      FROM "products" ORDER BY RANDOM()
    `,
  ]);

  const resolved = products.map((product) => ({
    slug: product.slug,
    title: localizedText(product.title, locale),
    previewImageUrl: product.previewImageKey,
    widthCm: product.widthCm,
    heightCm: product.heightCm,
    priceEur: Number(product.priceEur),
    material: product.material,
    status: product.status as ProductStatus,
  }));

  const heroPaintings = heroRows.map((row) => ({
    slug: row.slug,
    title: localizedText(row.title, locale),
    previewImageUrl: row.previewImageKey,
    widthCm: row.widthCm,
    heightCm: row.heightCm,
    material: row.material,
    priceEur: Number(row.priceEur),
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
        focusSlug={focus}
      />
    </div>
  );
}
