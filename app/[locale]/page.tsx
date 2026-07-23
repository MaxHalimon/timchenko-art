import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { HeroSlideshow, type SlideImage } from "./components/HeroSlideshow/HeroSlideshow";
import { ManifestoStatement } from "./components/ManifestoStatement/ManifestoStatement";
import { ProductCard, type ProductStatus } from "./components/ProductCard/ProductCard";
import styles from "./components/shared/ProductGrid.module.css";

export default async function HomePage() {
  const t = await getTranslations("home");

  // Slideshow: latest paintings regardless of status — this is a portfolio
  // showcase, not a purchase list, so a recently SOLD piece is still worth
  // featuring here.
  const slideshowProducts = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const slides: SlideImage[] = slideshowProducts.map((product) => ({
    url: product.previewImageKey,
    alt: product.title,
  }));

  // "Останні роботи" grid below the fold: only pieces a visitor can actually
  // act on (buy now, or see is in progress) — SOLD stays out of this list.
  const featuredProducts = await prisma.product.findMany({
    where: { status: { not: "SOLD" } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <>
      <HeroSlideshow images={slides} />
      <ManifestoStatement />
      <section className={styles.section}>
        <h2 className={styles.heading}>{t("featuredHeading")}</h2>
        <div className={styles.grid}>
          {featuredProducts.map((product) => (
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
      </section>
    </>
  );
}
