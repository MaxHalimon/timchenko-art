import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { HeroVideo } from "./components/HeroVideo/HeroVideo";
import { ArtistIntro } from "./components/ArtistIntro/ArtistIntro";
import { ManifestoStatement } from "./components/ManifestoStatement/ManifestoStatement";
import { ProductCard, type ProductStatus } from "./components/ProductCard/ProductCard";
import styles from "./components/shared/ProductGrid.module.css";

export default async function HomePage() {
  const t = await getTranslations("home");

  // "Останні роботи" grid below the fold: only pieces a visitor can actually
  // act on (buy now, or see is in progress) — SOLD stays out of this list.
  const featuredProducts = await prisma.product.findMany({
    where: { status: { not: "SOLD" } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <>
      <HeroVideo src="/videos/hero-loop.mp4" poster="/videos/hero-poster.jpg" />
      <ArtistIntro />
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
