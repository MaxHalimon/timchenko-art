"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard, type ProductStatus } from "../ProductCard/ProductCard";
import styles from "./ProductCarousel.module.css";

export interface CarouselProduct {
  slug: string;
  title: string;
  previewImageUrl: string;
  widthCm: number;
  heightCm: number;
  priceUsd: number;
  status: ProductStatus;
}

const AUTOPLAY_INTERVAL_MS = 7000;
const STEP_TRANSITION = "transform 900ms cubic-bezier(0.25, 0.1, 0.25, 1)";
const ARROW_FLASH_MS = 500;

export function ProductCarousel({ products }: { products: CarouselProduct[] }) {
  const t = useTranslations("home");
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const count = products.length;

  // Three back-to-back copies of the list so the track can always show one
  // more card before/after without ever hitting a visible edge; we start
  // parked in the middle copy and silently snap back into it whenever we
  // drift into the first or third copy (see handleTransitionEnd below) —
  // that's what makes the loop feel infinite in both directions.
  const looped = count > 0 ? [...products, ...products, ...products] : [];
  const [index, setIndex] = useState(count);
  const indexRef = useRef(count);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Reset to the middle copy if the product list itself changes (e.g. a
  // different set of related paintings on a new product page).
  useEffect(() => {
    setIndex(count);
    indexRef.current = count;
  }, [count]);

  const [animate, setAnimate] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [autoplayTick, setAutoplayTick] = useState(0);
  const [stepPx, setStepPx] = useState(284);
  const [gapPx, setGapPx] = useState(24);
  const [edgePadding, setEdgePadding] = useState(0);
  const [flashLeft, setFlashLeft] = useState(false);
  const [flashRight, setFlashRight] = useState(false);
  const flashLeftTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashRightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measures the real on-screen distance between two cards (width + gap)
  // straight from the DOM, so it always matches whatever the CSS currently
  // says instead of duplicating those values in JS.
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

      // If the viewport's width isn't an exact multiple of one card's
      // width, split the leftover space evenly as left/right padding —
      // "N whole cards + one partially cut-off on the right" becomes "N
      // whole cards with a symmetric sliver peeking in on each side".
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

  // Autoplay: one card every 7s, moving forward (right-to-left). Paused
  // while the pointer is anywhere over the carousel (cards or arrows).
  // Respects prefers-reduced-motion by simply never starting.
  useEffect(() => {
    if (count <= 1 || isPaused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setAnimate(true);
      setIndex((i) => i + 1);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPaused, count, autoplayTick]);

  // After a real (animated) move finishes, silently jump back into the
  // middle copy if we've drifted into the cloned first/third copy — with
  // the transition switched off for exactly that one jump, so it's
  // invisible to the eye.
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

  // Double-rAF: lets the no-transition jump actually paint before we
  // switch the transition back on, otherwise the browser can animate the
  // jump itself instead of the next real move.
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
    setAutoplayTick((k) => k + 1); // restart the 7s countdown after a manual move
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

      <div className={styles.viewport} ref={viewportRef} style={{ paddingLeft: edgePadding, paddingRight: edgePadding }}>
        <div
          className={styles.track}
          ref={trackRef}
          onTransitionEnd={handleTransitionEnd}
          style={{
            // See ShowcaseCarousel for the full explanation — CSS `gap`
            // only adds space *between* items, never before the first
            // or after the last, so the content-box boundary needs to
            // sit at the *middle* of an inter-item gap (not flush with
            // an item's edge) for the left/right peek slivers to end up
            // showing equal amounts of actual image.
            transform: `translateX(-${index * stepPx - gapPx / 2}px)`,
            transition: animate ? STEP_TRANSITION : "none",
          }}
        >
          {looped.map((product, i) => (
            <div className={styles.item} key={`${product.slug}-${i}`}>
              <ProductCard {...product} />
            </div>
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
  );
}
