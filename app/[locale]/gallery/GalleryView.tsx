"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GalleryHero, type HeroPainting } from "./GalleryHero";
import { ViewSwitcher, type GalleryMode } from "./ViewSwitcher";
import { GalleryExhibition } from "./GalleryExhibition";
import { GalleryGrid, type GridProduct } from "./GalleryGrid";
import { FilterBar } from "./FilterBar";
import styles from "./page.module.css";

/**
 * Orchestrates the gallery page's two view modes (client-side state, no
 * navigation/reload when switching — per the brief). FilterBar + the
 * ViewSwitcher sit on one shared panel above whichever mode is active,
 * since both modes browse the same filtered list of `products`.
 *
 * `products` doubles as both the exhibition slideshow's slides and the
 * grid's cards — same shape covers both (see GridProduct), so there's
 * one query behind everything on this page, not two.
 */
export function GalleryView({
  products,
  heroPaintings,
  themeOptions,
  current,
  defaultMode,
}: {
  products: GridProduct[];
  heroPaintings: HeroPainting[];
  themeOptions: string[];
  current: { size?: string; theme?: string; status?: string };
  defaultMode: GalleryMode;
}) {
  const t = useTranslations("gallery");
  const [mode, setMode] = useState<GalleryMode>(defaultMode);
  const [exhibitionStart, setExhibitionStart] = useState(0);

  function handleLaunch(index: number) {
    setExhibitionStart(index);
    setMode("exhibition");
  }

  if (products.length === 0) {
    return (
      <div>
        <FilterBar themeOptions={themeOptions} current={current} />
        <p className={styles.empty}>{t("empty")}</p>
      </div>
    );
  }

  return (
    <>
      <GalleryHero paintings={heroPaintings} onLaunch={handleLaunch} />

      <div className={styles.controlPanel}>
        <FilterBar themeOptions={themeOptions} current={current} />
        <ViewSwitcher mode={mode} onChange={setMode} />
      </div>

      {mode === "exhibition" ? (
        <GalleryExhibition paintings={products} startIndex={exhibitionStart} />
      ) : (
        <GalleryGrid products={products} />
      )}
    </>
  );
}
