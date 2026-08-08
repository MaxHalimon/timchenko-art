"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FocusCardModal } from "../FocusCardModal/FocusCardModal";
import styles from "./ShowcaseCarousel.module.css";

export interface ShowcaseImage {
  slug: string;
  title: string;
  previewImageUrl: string;
}

const AUTOPLAY_INTERVAL_MS = 7000;
const STEP_TRANSITION = "transform 900ms cubic-bezier(0.25, 0.1, 0.25, 1)";
const ARROW_FLASH_MS = 500;
const SWIPE_THRESHOLD_PX = 40;

/**
 * The home page "Вітрина" carousel: unlike ProductCarousel (used for
 * "related paintings", which shows full cards with price/status), this
 * shows just the paintings themselves, all at the same uniform size —
 * clicking one opens a compact "focus card" popup (FocusCardModal),
 * which nudges toward the full gallery experience rather than opening a
 * full-screen viewer right here.
 *
 * The autoplay/infinite-loop/pause-on-hover/arrow-flash mechanics here
 * are intentionally the same proven approach as ProductCarousel — copied
 * rather than shared, so changes to one can't accidentally affect the
 * other (they now serve genuinely different roles). Touch swipe is new
 * here: a swipe past SWIPE_THRESHOLD_PX advances/reverses the carousel
 * and suppresses the tap-to-open click that would otherwise follow it.
 */
export function ShowcaseCarousel({ images }: { images: ShowcaseImage[] }) {
  const t = useTranslations("home");
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const count = images.length;

  const looped = count > 0 ? [...images, ...images, ...images] : [];
  const [index, setIndex] = useState(count);
  const indexRef = useRef(count);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    setIndex(count);
    indexRef.current = count;
  }, [count]);

  const [animate, setAnimate] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [autoplayTick, setAutoplayTick] = useState(0);
  const [stepPx, setStepPx] = useState(244);
  const [gapPx, setGapPx] = useState(24);
  const [edgePadding, setEdgePadding] = useState(0);
  const [flashLeft, setFlashLeft] = useState(false);
  const [flashRight, setFlashRight] = useState(false);
  const flashLeftTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashRightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openAt, setOpenAt] = useState<number | null>(null); // index into `images` (not `looped`), or null when closed
  const touchStartX = useRef<number | null>(null);
  const wasSwipe = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX) {
      advance(deltaX < 0 ? 1 : -1);
      wasSwipe.current = true; // suppress the tap-to-open click that follows this touch
    }
    touchStartX.current = null;
  }

  function handleItemClick(imageIndex: number) {
    if (wasSwipe.current) {
      wasSwipe.current = false;
      return;
    }
    setOpenAt(imageIndex);
  }

  useEffect(() => {
    function measure() {
      const track = trackRef.current;
      const viewport = viewportRef.current;
      if (!track) return;
      const first = track.children[0] as HTMLElement | undefined;
      const second = track.children[1] as HTMLElement | undefined;
      let step = stepPx;
      if (first && second) {
        step = second.offsetLeft - first.offsetLeft;
        setStepPx(step);
        setGapPx(step - first.offsetWidth);
      } else if (first) {
        step = first.offsetWidth;
        setStepPx(step);
      }

      // If the viewport's width isn't an exact multiple of one item's
      // width, a whole extra item's worth of leftover space is left
      // over. Splitting it evenly as left/right padding turns "N whole
      // items + one partially cut-off item on the right" into "N whole
      // items with a symmetric sliver peeking in on each side" — the
      // clipped part still renders (overflow:hidden clips at the outer
      // edge, which now includes this padding), it's just evenly split.
      if (viewport && step > 0) {
        const remainder = viewport.offsetWidth % step;
        setEdgePadding(remainder / 2);
      }
    }
    measure();

    // ResizeObserver instead of a plain window "resize" listener — it
    // also catches layout shifts that aren't a window resize (fonts
    // finishing loading, a scrollbar appearing/disappearing, etc.), so
    // the measurement can't go stale from missing one of those.
    const viewport = viewportRef.current;
    if (viewport && typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => measure());
      observer.observe(viewport);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useEffect(() => {
    if (count <= 1 || isPaused || openAt !== null) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setAnimate(true);
      setIndex((i) => i + 1);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPaused, count, autoplayTick, openAt]);

  function handleTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== "transform") return;
    const current = indexRef.current;
    if (current >= count * 2) {
      setAnimate(false);
      setIndex(current - count);
    } else if (current < count) {
      setAnimate(false);
      setIndex(current + count);
    }
  }

  useEffect(() => {
    if (animate) return;
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [animate]);

  function advance(direction: 1 | -1) {
    setAnimate(true);
    setIndex((i) => i + direction);
    setAutoplayTick((k) => k + 1);
  }

  function handleArrowClick(direction: 1 | -1) {
    advance(direction);
    if (direction === -1) {
      setFlashLeft(true);
      if (flashLeftTimeout.current) clearTimeout(flashLeftTimeout.current);
      flashLeftTimeout.current = setTimeout(() => setFlashLeft(false), ARROW_FLASH_MS);
    } else {
      setFlashRight(true);
      if (flashRightTimeout.current) clearTimeout(flashRightTimeout.current);
      flashRightTimeout.current = setTimeout(() => setFlashRight(false), ARROW_FLASH_MS);
    }
  }

  useEffect(
    () => () => {
      if (flashLeftTimeout.current) clearTimeout(flashLeftTimeout.current);
      if (flashRightTimeout.current) clearTimeout(flashRightTimeout.current);
    },
    [],
  );

  if (count === 0) return null;

  return (
    <>
      <div className={styles.wrapper} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowLeft} ${flashLeft ? styles.arrowFlash : ""}`}
          aria-label={t("carouselPrev")}
          onClick={() => handleArrowClick(-1)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div
          className={styles.viewport}
          ref={viewportRef}
          style={{ paddingLeft: edgePadding, paddingRight: edgePadding }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={styles.track}
            ref={trackRef}
            onTransitionEnd={handleTransitionEnd}
            style={{
              // The extra "+ gapPx/2" is deliberate, not a rounding
              // nicety: CSS `gap` only adds space *between* items, never
              // before the first or after the last, so naively aligning
              // this transform straight at "index * stepPx" lines the
              // content-box boundary up flush with an item's edge —
              // which puts almost the *entire* inter-item gap on one
              // side of that boundary and almost none on the other.
              // Shifting by half a gap moves the boundary to the middle
              // of the gap instead, so the peek zones on the left and
              // right end up showing equal slivers of actual image.
              transform: `translateX(-${index * stepPx - gapPx / 2}px)`,
              transition: animate ? STEP_TRANSITION : "none",
            }}
          >
            {looped.map((image, i) => (
              <button
                type="button"
                key={`${image.slug}-${i}`}
                className={styles.item}
                onClick={() => handleItemClick(i % count)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.previewImageUrl} alt={image.title} className={styles.image} />
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowRight} ${flashRight ? styles.arrowFlash : ""}`}
          aria-label={t("carouselNext")}
          onClick={() => handleArrowClick(1)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {openAt !== null && (
        <FocusCardModal image={images[openAt]} onClose={() => setOpenAt(null)} />
      )}
    </>
  );
}
