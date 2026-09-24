"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
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

// Guess used for exactly one paint before the real tile count is
// measured (see the layout effect below) — low-stakes either way since
// it self-corrects immediately, before the browser paints anything for
// a client-side navigation.
const INITIAL_VISIBLE_GUESS = 4;

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
 * pause-on-hover, nothing to operate, and (deliberately) nothing ever
 * pauses it either, focused or not. Pure CSS `animation` (translateX
 * 0 → -50% on a track holding the painting list twice back-to-back,
 * linear + infinite) — content moves right-to-left: new tiles enter
 * from the right, existing ones exit to the left. Duration is derived
 * from the track's actual measured pixel width (halved, since -50% is
 * one full list) divided by a constant px/sec target — not from the
 * painting count, which would make crawl speed depend on tile size
 * (varies by the responsive breakpoints below) instead of staying
 * constant everywhere.
 *
 * `focusSlug` (arrives via ?focus= on the URL — see "переглянути в
 * галереї" links) doesn't touch the animation timing at all — it
 * rotates the painting list (like spinning a wheel: relative order
 * preserved, only the starting point shifts) so that painting lands
 * just past the edge of what's initially visible, on the right —
 * since the row moves right-to-left, that's the position it's about to
 * scroll INTO view from, giving it a full, visible entrance rather than
 * being the tile that's already at the front of the queue exiting left
 * (index 0 — tried that first; wrong side, given the scroll direction).
 * That "just past the visible edge" position is a real measurement
 * (visible marquee width ÷ measured tile width), not a guess, since
 * tile count-per-screen varies by breakpoint/viewport.
 *
 * It also gets a brief three-pulse scale-up (5%, smooth ease-in-out) —
 * not a box-shadow/glow, which didn't read against the page's white
 * background — so the eye catches it as it enters.
 *
 * The one other interaction stays exactly what it already was: clicking
 * any painting opens the same slideshow as before; the CTA still starts
 * it on a random painting with autoplay on.
 */
export function GalleryHero({ paintings, focusSlug }: { paintings: HeroPainting[]; focusSlug?: string }) {
  const t = useTranslations("gallery");
  const [openState, setOpenState] = useState<{ index: number; autoplay: boolean } | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_GUESS);

  // Rotate (not filter/reinsert) so every other painting keeps its
  // position relative to the others — only the starting point shifts.
  // Places the target at index `visibleCount` (clamped): the first tile
  // NOT in the initially-visible window, i.e. the next one due to
  // scroll in from the right.
  const ordered = useMemo(() => {
    if (!focusSlug || paintings.length === 0) return paintings;
    const targetIdx = paintings.findIndex((p) => p.slug === focusSlug);
    if (targetIdx === -1) return paintings;
    const len = paintings.length;
    // visibleCount tiles fit fully on screen at once (indices 0..visibleCount-1
    // from the left edge); visibleCount itself would be the *next* tile,
    // just starting to peek in from the right — only partially visible.
    // -1 lands on the last fully-visible slot instead.
    const rotateTo = Math.min(Math.max(visibleCount - 1, 0), len - 1);
    // Rotating the array left by k moves old[targetIdx] to new index
    // (targetIdx - k) mod len; solve for k so it lands at rotateTo.
    const k = (((targetIdx - rotateTo) % len) + len) % len;
    return [...paintings.slice(k), ...paintings.slice(0, k)];
  }, [paintings, focusSlug, visibleCount]);

  const flashIndex = focusSlug ? ordered.findIndex((p) => p.slug === focusSlug) : -1;

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    function measure() {
      // row holds the list twice back-to-back; one full loop covers
      // exactly one copy, i.e. half the rendered width.
      const oneListWidth = row!.scrollWidth / 2;
      setDurationSeconds(oneListWidth / PIXELS_PER_SECOND);

      if (focusSlug && ordered.length > 0) {
        const marqueeWidth = row!.parentElement?.clientWidth ?? 0;
        const perTile = oneListWidth / ordered.length;
        if (perTile > 0) {
          const count = Math.max(1, Math.floor(marqueeWidth / perTile));
          setVisibleCount((prev) => (prev === count ? prev : count));
        }
      }
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [ordered, focusSlug]);

  if (ordered.length === 0) return null;

  const looped = [...ordered, ...ordered];

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
              className={i === flashIndex ? `${styles.tile} ${styles.tileFlash}` : styles.tile}
              onClick={() => setOpenState({ index: i % ordered.length, autoplay: false })}
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
          onClick={() => setOpenState({ index: Math.floor(Math.random() * ordered.length), autoplay: true })}
        >
          {t("launchTour")}
        </button>
      </div>

      {openState && (
        <ImageSlideshowModal
          images={ordered}
          initialIndex={openState.index}
          autoplayOnOpen={openState.autoplay}
          onClose={() => setOpenState(null)}
        />
      )}
    </div>
  );
}
