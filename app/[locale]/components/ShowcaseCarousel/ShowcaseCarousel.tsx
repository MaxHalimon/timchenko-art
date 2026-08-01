"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImageSlideshowModal } from "../ImageSlideshowModal/ImageSlideshowModal";
import styles from "./ShowcaseCarousel.module.css";

export interface ShowcaseImage {
  slug: string;
  title: string;
  previewImageUrl: string;
}

const AUTOPLAY_INTERVAL_MS = 7000;
const STEP_TRANSITION = "transform 900ms cubic-bezier(0.25, 0.1, 0.25, 1)";
const ARROW_FLASH_MS = 500;

/**
 * The home page "Вітрина" carousel: unlike ProductCarousel (used for
 * "related paintings", which shows full cards with price/status), this
 * shows just the paintings themselves, all at the same uniform size —
 * clicking one opens the full slideshow viewer (ImageSlideshowModal).
 *
 * The autoplay/infinite-loop/pause-on-hover/arrow-flash mechanics here
 * are intentionally the same proven approach as ProductCarousel — copied
 * rather than shared, so changes to one can't accidentally affect the
 * other (they now serve genuinely different roles).
 */
export function ShowcaseCarousel({ images }: { images: ShowcaseImage[] }) {
  const t = useTranslations("home");
  const trackRef = useRef<HTMLDivElement>(null);
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
  const [flashLeft, setFlashLeft] = useState(false);
  const [flashRight, setFlashRight] = useState(false);
  const flashLeftTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashRightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openAt, setOpenAt] = useState<number | null>(null); // index into `images` (not `looped`), or null when closed

  useEffect(() => {
    function measure() {
      const track = trackRef.current;
      if (!track) return;
      const first = track.children[0] as HTMLElement | undefined;
      const second = track.children[1] as HTMLElement | undefined;
      if (first && second) {
        setStepPx(second.offsetLeft - first.offsetLeft);
      } else if (first) {
        setStepPx(first.offsetWidth);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
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

        <div className={styles.viewport}>
          <div
            className={styles.track}
            ref={trackRef}
            onTransitionEnd={handleTransitionEnd}
            style={{
              transform: `translateX(-${index * stepPx}px)`,
              transition: animate ? STEP_TRANSITION : "none",
            }}
          >
            {looped.map((image, i) => (
              <button
                type="button"
                key={`${image.slug}-${i}`}
                className={styles.item}
                onClick={() => setOpenAt(i % count)}
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
        <ImageSlideshowModal images={images} initialIndex={openAt} onClose={() => setOpenAt(null)} />
      )}
    </>
  );
}
