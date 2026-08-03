"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import buttonStyles from "../shared/Buttons.module.css";
import styles from "./ImageSlideshowModal.module.css";

export interface SlideshowImage {
  slug: string;
  title: string;
  previewImageUrl: string;
}

const AUTOPLAY_INTERVAL_MS = 4000;
const SWIPE_THRESHOLD_PX = 50;

/**
 * Full-screen slideshow viewer opened by clicking a painting in
 * ShowcaseCarousel. Controls: play/pause (auto-advance), prev/next
 * (click on desktop, swipe on touch — both always work regardless of
 * play state), a "go to gallery" link, and close via the × button, the
 * backdrop, or Escape.
 */
export function ImageSlideshowModal({
  images,
  initialIndex,
  onClose,
}: {
  images: SlideshowImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const t = useTranslations("slideshow");
  const count = images.length;
  const [index, setIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const triggerElement = useRef<Element | null>(null);

  function goTo(next: number) {
    setIndex(((next % count) + count) % count); // wrap both directions
  }

  // Autoplay while playing; any manual navigation doesn't need to touch
  // this, it just restarts naturally from the new index.
  useEffect(() => {
    if (!isPlaying || count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPlaying, count]);

  // Lock background scroll, remember what had focus, focus the dialog,
  // restore focus to the trigger on unmount — standard modal hygiene.
  useEffect(() => {
    triggerElement.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (triggerElement.current instanceof HTMLElement) {
        triggerElement.current.focus();
      }
    };
  }, []);

  // Keyboard: Escape closes, arrows navigate, space toggles play/pause.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goTo(index - 1);
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

  const current = images[index];

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button type="button" className={`${styles.circleButton} ${styles.closeButton}`} aria-label={t("close")} onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={current.title}
        tabIndex={-1}
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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
          <img src={current.previewImageUrl} alt={current.title} className={styles.image} />

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
            <p className={styles.counter}>{t("counter", { current: index + 1, total: count })}</p>
          </div>

          <Link
            href={`/product/${current.slug}`}
            className={`${buttonStyles.galleryButton} ${styles.footerButton}`}
            onClick={onClose}
          >
            {t("buyThisPainting")}
          </Link>

          <Link
            href="/gallery"
            className={`${buttonStyles.galleryButtonOutline} ${styles.galleryLink} ${styles.footerButton}`}
            onClick={onClose}
          >
            {t("goToGallery")}
          </Link>
        </div>
      </div>
    </div>
  );
}
