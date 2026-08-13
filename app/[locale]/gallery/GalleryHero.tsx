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

const SECONDS_PER_PAINTING = 6;

/**
 * Just a greeting — a row of randomly-picked paintings, independent of
 * whatever filters are set below (this pool is fetched separately, see
 * page.tsx). Always a single horizontal row, even on mobile — it never
 * reflows into a stacked column, tile size just shrinks with the
 * viewport instead (see the CSS for how).
 *
 * Moves as a continuous, slow, uninterrupted loop — no arrows, no
 * pause-on-hover, nothing to operate. Pure CSS `animation` (translateX
 * 0 → -50% on a track holding the painting list twice back-to-back,
 * linear + infinite) rather than a JS-timer carousel — simpler, and a
 * plain CSS animation can't stutter the way a timed React state update
 * occasionally can. The one and only interaction stays exactly what it
 * already was: clicking any painting (moving or not — CSS transforms
 * don't affect click handling) opens the same slideshow as before; the
 * CTA still starts it on a random painting with autoplay on.
 */
export function GalleryHero({ paintings }: { paintings: HeroPainting[] }) {
  const t = useTranslations("gallery");
  const [openState, setOpenState] = useState<{ index: number; autoplay: boolean } | null>(null);

  if (paintings.length === 0) return null;

  const looped = [...paintings, ...paintings];
  const durationSeconds = paintings.length * SECONDS_PER_PAINTING;

  return (
    <div className={styles.wrapper}>
      <div className={styles.marquee}>
        <div className={styles.row} style={{ animationDuration: `${durationSeconds}s` }}>
          {looped.map((painting, i) => (
            <button
              type="button"
              key={`${painting.slug}-${i}`}
              className={styles.tile}
              onClick={() => setOpenState({ index: i % paintings.length, autoplay: false })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={painting.previewImageUrl} alt={painting.title} className={styles.image} />
            </button>
          ))}
        </div>
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
