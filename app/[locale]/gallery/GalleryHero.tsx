"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImageSlideshowModal } from "../components/ImageSlideshowModal/ImageSlideshowModal";
import buttonStyles from "../components/shared/Buttons.module.css";
import styles from "./GalleryHero.module.css";

export interface HeroPainting {
  slug: string;
  title: string;
  previewImageUrl: string;
}

// Constant crawl speed, in pixels/second — 9.8px/s (30% slower than the
// previous 14px/s target) applied uniformly at every breakpoint.
const PIXELS_PER_SECOND = 9.8;

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
 * linear + infinite), but the *duration* is derived from the track's
 * actual measured pixel width (halved, since -50% is one full list)
 * divided by a constant px/sec target — not from the painting count.
 * Duration-from-count made the crawl speed (px/sec) depend on tile size,
 * which changes across the responsive breakpoints below, so the same
 * row visibly sped up or slowed down as the viewport resized. Measuring
 * the real width keeps px/sec constant everywhere, including while the
 * window is being resized live (ResizeObserver re-measures on every
 * layout change). The one and only interaction stays exactly what it
 * already was: clicking any painting (moving or not — CSS transforms
 * don't affect click handling) opens the same slideshow as before; the
 * CTA still starts it on a random painting with autoplay on.
 */
export function GalleryHero({ paintings }: { paintings: HeroPainting[] }) {
  const t = useTranslations("gallery");
  const [openState, setOpenState] = useState<{ index: number; autoplay: boolean } | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    function measure() {
      // row holds the list twice back-to-back; one full loop (translateX
      // 0 → -50%) covers exactly one copy, i.e. half the rendered width.
      const oneListWidth = row!.scrollWidth / 2;
      setDurationSeconds(oneListWidth / PIXELS_PER_SECOND);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [paintings]);

  if (paintings.length === 0) return null;

  const looped = [...paintings, ...paintings];

  return (
    <div className={styles.wrapper}>
      <div className={styles.marquee}>
        <div
          ref={rowRef}
          className={styles.row}
          style={durationSeconds ? { animationDuration: `${durationSeconds}s` } : { animationPlayState: "paused" }}
        >
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
