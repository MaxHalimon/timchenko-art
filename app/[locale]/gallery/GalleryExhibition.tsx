"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PriceTag } from "../components/PriceTag/PriceTag";
import buttonStyles from "../components/shared/Buttons.module.css";
import styles from "./GalleryExhibition.module.css";

export interface ExhibitionPainting {
  slug: string;
  title: string;
  previewImageUrl: string;
  widthCm: number;
  heightCm: number;
  priceUsd: number;
  status: "AVAILABLE" | "IN_PROGRESS" | "SOLD";
}

const AUTOPLAY_INTERVAL_MS = 4000;
const SWIPE_THRESHOLD_PX = 50;

/**
 * "Режим виставки" — an inline (not a modal/overlay) cinematic slider,
 * dark section sitting right in the page flow between the switcher and
 * the footer. Same interaction language as ImageSlideshowModal (play/
 * pause, arrows, swipe, keyboard) but adapted for living permanently on
 * the page rather than popping up over it: no close/backdrop, no focus
 * trap, no body-scroll lock — the visitor just uses the ViewSwitcher
 * above to leave it.
 */
export function GalleryExhibition({
  paintings,
  startIndex = 0,
  launchToken = 0,
  autoplayOnLaunch = false,
}: {
  paintings: ExhibitionPainting[];
  startIndex?: number;
  /** Increments on every launch (tile click or tour CTA) — the one
   * reliable signal that "a new launch happened", since this component
   * doesn't always remount (e.g. already in exhibition mode). */
  launchToken?: number;
  /** Whether *this particular* launch should start the slideshow playing —
   * true only for the "Режим гіда" CTA, not for a plain tile click. */
  autoplayOnLaunch?: boolean;
}) {
  const t = useTranslations("slideshow");
  const tCard = useTranslations("productCard");
  const count = paintings.length;
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(count - 1, 0)));
  const [isPlaying, setIsPlaying] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Jump to whichever painting was just launched, and turn autoplay on if
  // this launch asked for it — keyed on launchToken (not startIndex),
  // since that's the only value guaranteed to change on every single
  // launch, remount or not.
  useEffect(() => {
    setIndex(Math.min(startIndex, Math.max(count - 1, 0)));
    if (autoplayOnLaunch) setIsPlaying(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchToken]);

  function goTo(next: number) {
    if (count === 0) return;
    setIndex(((next % count) + count) % count);
  }

  useEffect(() => {
    if (!isPlaying || count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPlaying, count]);

  // Arrow keys/space only act while this section is actually in view, so
  // they don't hijack the keyboard while the visitor is elsewhere on the
  // page (e.g. scrolled down to the footer).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX) {
      goTo(deltaX < 0 ? index + 1 : index - 1);
    }
    touchStartX.current = null;
  }

  if (count === 0) return null;

  const current = paintings[index];
  const isSold = current.status === "SOLD";

  return (
    <div ref={sectionRef} className={styles.section} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className={styles.imageArea}>
        <button
          type="button"
          className={`${styles.circleButton} ${styles.navArrow} ${styles.navArrowLeft}`}
          aria-label={t("prev")}
          onClick={() => goTo(index - 1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.previewImageUrl}
          alt={current.title}
          className={isSold ? `${styles.image} ${styles.imageSold}` : styles.image}
        />

        <button
          type="button"
          className={`${styles.circleButton} ${styles.navArrow} ${styles.navArrowRight}`}
          aria-label={t("next")}
          onClick={() => goTo(index + 1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={`${styles.circleButton} ${styles.playButton}`}
          aria-label={isPlaying ? t("pause") : t("play")}
          onClick={() => setIsPlaying((p) => !p)}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" />
              <rect x="14" y="5" width="4" height="14" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7 5l12 7-12 7V5z" />
            </svg>
          )}
        </button>

        <div className={styles.caption}>
          <p className={styles.title}>{current.title}</p>
          <p className={styles.meta}>
            {tCard("dimensions", { width: current.widthCm, height: current.heightCm })} · {tCard("material")}
            {!isSold && (
              <>
                {" · "}
                <PriceTag amountUsd={current.priceUsd} />
              </>
            )}
            {isSold && ` · ${tCard("status.SOLD")}`}
          </p>
          <p className={styles.counter}>{t("counter", { current: index + 1, total: count })}</p>
        </div>

        <Link href={`/product/${current.slug}`} className={`${buttonStyles.galleryButton} ${styles.footerButton}`}>
          {t("buyThisPainting")}
        </Link>
      </div>
    </div>
  );
}
