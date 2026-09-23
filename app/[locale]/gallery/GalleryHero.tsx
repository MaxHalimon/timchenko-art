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
  widthCm?: number;
  heightCm?: number;
  material?: string;
  priceEur?: number;
}

// Constant crawl speed, in pixels/second — 9.8px/s (30% slower than the
// previous 14px/s target) applied uniformly at every breakpoint.
const PIXELS_PER_SECOND = 9.8;

/**
 * Just a greeting — every painting on the site, in one row (this pool is
 * fetched separately, see page.tsx; it's the whole catalog, not a
 * sample, and stays correct on its own as paintings sell or new ones
 * are added — nothing here is cached or hardcoded). Always a single
 * horizontal row, even on mobile — it never reflows into a stacked
 * column, tile size just shrinks with the viewport instead (see the
 * CSS for how). Images past the first few load lazily
 * (`loading="lazy"`) since the row can now be long.
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
 * layout change).
 *
 * `focusSlug` (arrives via ?focus= on the URL — see "переглянути в
 * галереї" links) overrides all of that: the loop pauses, the row jumps
 * to a fixed offset that centers that one painting in the visible strip,
 * and that tile gets a highlight ring — so a visitor coming from a
 * specific painting elsewhere on the site sees it immediately instead
 * of having to catch it mid-scroll. It stays paused there for the rest
 * of this page view (not just a few seconds) — the visitor came here
 * for that one painting, not to watch the greeting strip keep moving.
 *
 * The one other interaction stays exactly what it already was: clicking
 * any painting (moving, paused, or focused — none of that affects click
 * handling) opens the same slideshow as before; the CTA still starts it
 * on a random painting with autoplay on.
 */
export function GalleryHero({ paintings, focusSlug }: { paintings: HeroPainting[]; focusSlug?: string }) {
  const t = useTranslations("gallery");
  const [openState, setOpenState] = useState<{ index: number; autoplay: boolean } | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [focusOffsetPx, setFocusOffsetPx] = useState<number | null>(null);

  const focusIndex = focusSlug ? paintings.findIndex((p) => p.slug === focusSlug) : -1;

  // Normal crawl-speed measuring — only matters while nothing is focused,
  // but stays running regardless so it's ready if focusSlug is ever
  // cleared (e.g. the visitor navigates to a plain /gallery link next).
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    function measure() {
      const oneListWidth = row!.scrollWidth / 2;
      setDurationSeconds(oneListWidth / PIXELS_PER_SECOND);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [paintings]);

  // Centers the focused tile: offset = half the visible strip's width,
  // minus how far into the (single, un-doubled) row that tile's center
  // sits. Recomputed on resize so it stays centered if the viewport
  // changes size while paused here.
  useEffect(() => {
    if (focusIndex === -1) {
      setFocusOffsetPx(null);
      return;
    }

    const row = rowRef.current;
    const marquee = row?.parentElement;
    if (!row || !marquee) return;

    function center() {
      const tile = row!.children[focusIndex] as HTMLElement | undefined;
      if (!tile) return;
      const tileCenter = tile.offsetLeft + tile.offsetWidth / 2;
      setFocusOffsetPx(marquee!.clientWidth / 2 - tileCenter);
    }

    center();
    const observer = new ResizeObserver(center);
    observer.observe(marquee);
    return () => observer.disconnect();
  }, [focusIndex]);

  if (paintings.length === 0) return null;

  const looped = [...paintings, ...paintings];

  const rowStyle =
    focusOffsetPx !== null
      ? { animation: "none", transform: `translateX(${focusOffsetPx}px)` }
      : durationSeconds
        ? { animationDuration: `${durationSeconds}s` }
        : { animationPlayState: "paused" as const };

  return (
    <div className={styles.wrapper}>
      <div className={styles.marquee}>
        <div ref={rowRef} className={styles.row} style={rowStyle}>
          {looped.map((painting, i) => (
            <button
              type="button"
              key={`${painting.slug}-${i}`}
              data-slug={painting.slug}
              className={i === focusIndex ? `${styles.tile} ${styles.tileFocused}` : styles.tile}
              onClick={() => setOpenState({ index: i % paintings.length, autoplay: false })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={painting.previewImageUrl}
                alt={painting.title}
                className={styles.image}
                loading={i < 6 ? "eager" : "lazy"}
              />
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
