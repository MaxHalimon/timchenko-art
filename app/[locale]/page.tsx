import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { localizedText } from "@/lib/localizedText";
import { HeroVideo } from "./components/HeroVideo/HeroVideo";
import { ArtistIntro } from "./components/ArtistIntro/ArtistIntro";
import { ManifestoStatement } from "./components/ManifestoStatement/ManifestoStatement";
import { ShowcaseCarousel } from "./components/ShowcaseCarousel/ShowcaseCarousel";
import { AccentText } from "./components/AccentText/AccentText";
import styles from "./components/shared/ProductGrid.module.css";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations("home");

  // "Вітрина" carousel: a random selection of purchasable/in-progress
  // pieces (SOLD stays out) — pulled fresh from a bounded recent pool and
  // shuffled per page load, so it's not the same lineup every visit.
  const pool = await prisma.product.findMany({
    where: { status: { not: "SOLD" } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const showcaseImages = shuffle(pool)
    .slice(0, 10)
    .map((product) => ({
      slug: product.slug,
      title: localizedText(product.title, locale),
      previewImageUrl: product.previewImageKey,
    }));

  return (
    <>
      <HeroVideo src="/videos/hero-loop.mp4" poster="/videos/hero-poster.jpg" />
      <ManifestoStatement />
      <section className={styles.section}>
        <h2 className={styles.heading}>
          <AccentText text={t("featuredHeading")} />
        </h2>
        <ShowcaseCarousel images={showcaseImages} />
      </section>
      <ArtistIntro />
    </>
  );
}
