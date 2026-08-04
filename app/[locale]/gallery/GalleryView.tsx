"use client";

import { useTranslations } from "next-intl";
import { GalleryHero, type HeroPainting } from "./GalleryHero";
import { GalleryGrid, type GridProduct } from "./GalleryGrid";
import { FilterBar } from "./FilterBar";
import styles from "./page.module.css";

/**
 * The hero (just a greeting, its own random pool — see page.tsx) sits
 * above everything and doesn't care about filters. Below it: FilterBar
 * + the product grid, which does. No more mode-switching — the "player"
 * (an inline full-height slideshow section) was retired; the equivalent
 * full-screen experience now lives entirely inside GalleryHero, opened
 * via ImageSlideshowModal.
 */
export function GalleryView({
  products,
  heroPaintings,
  themeOptions,
  current,
}: {
  products: GridProduct[];
  heroPaintings: HeroPainting[];
  themeOptions: string[];
  current: { size?: string; theme?: string; status?: string };
}) {
  const t = useTranslations("gallery");

  return (
    <>
      <GalleryHero paintings={heroPaintings} />

      <FilterBar themeOptions={themeOptions} current={current} />

      {products.length === 0 ? <p className={styles.empty}>{t("empty")}</p> : <GalleryGrid products={products} />}
    </>
  );
}
