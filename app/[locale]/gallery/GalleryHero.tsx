"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageSlideshowModal } from "../components/ImageSlideshowModal/ImageSlideshowModal";
import buttonStyles from "../components/shared/Buttons.module.css";
import styles from "./GalleryHero.module.css";

export interface HeroPainting {
  slug: string;
  title: string;
  previewImageUrl: string;
}

/**
 * Just a greeting — a row of randomly-picked paintings, independent of
 * whatever filters are set below (this pool is fetched separately, see
 * page.tsx). Always a single horizontal row, even on mobile — it never
 * reflows into a stacked column, tile size just shrinks with the
 * viewport instead (see the CSS for how).
 *
 * Clicking a tile, or the "Пройти на екскурсію" CTA, opens the same
 * full-screen slideshow (ImageSlideshowModal) over this same pool of
 * paintings — a tile click starts right on that painting; the CTA
 * starts on a random one and begins auto-advancing immediately, like an
 * actual guide kicking off a tour.
 */
export function GalleryHero({ paintings }: { paintings: HeroPainting[] }) {
  const t = useTranslations("gallery");
  const [openState, setOpenState] = useState<{ index: number; autoplay: boolean } | null>(null);

  if (paintings.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        {paintings.map((painting, i) => (
          <button
            type="button"
            key={painting.slug}
            className={styles.tile}
            onClick={() => setOpenState({ index: i, autoplay: false })}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={painting.previewImageUrl} alt={painting.title} className={styles.image} />
          </button>
        ))}
      </div>

      <div className={styles.ctaRow}>
        <button
          type="button"
          className={buttonStyles.galleryButton}
          onClick={() => setOpenState({ index: Math.floor(Math.random() * paintings.length), autoplay: true })}
        >
          {t("launchTour")}
        </button>
      </div>

      {openState && (
        <ImageSlideshowModal
          images={paintings}
          initialIndex={openState.index}
          autoplayOnOpen={openState.autoplay}
          onClose={() => setOpenState(null)}
        />
      )}
    </div>
  );
}
