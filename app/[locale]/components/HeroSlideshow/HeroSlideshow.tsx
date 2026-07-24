"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./HeroSlideshow.module.css";

const SLIDE_DURATION_MS = 5000;

export interface SlideImage {
  url: string;
  alt: string;
}

export function HeroSlideshow({ images }: { images: SlideImage[] }) {
  const t = useTranslations("common");
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (images.length <= 1 || reducedMotionRef.current) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, SLIDE_DURATION_MS);

    return () => clearInterval(interval);
  }, [images.length]);

  function scrollToNextSection() {
    window.scrollTo({ top: window.innerHeight * 0.75, behavior: "smooth" });
  }

  if (images.length === 0) {
    // No paintings seeded yet — show a plain gradient with the site name
    // rather than a broken/empty slideshow.
    return (
      <div className={styles.slideshow}>
        <div className={styles.fallback}>
          <span className={styles.fallbackText}>{t("siteName")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.slideshow}>
      {images.map((image, i) => (
        <div key={image.url} className={i === activeIndex ? `${styles.slide} ${styles.slideActive}` : styles.slide}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.alt} className={styles.slideImage} />
        </div>
      ))}

      {images.length > 1 && (
        <div className={styles.dots}>
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              className={i === activeIndex ? `${styles.dot} ${styles.dotActive}` : styles.dot}
              aria-label={`${i + 1}`}
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </div>
      )}

      <button type="button" className={styles.scrollCue} aria-label={t("scrollHint")} onClick={scrollToNextSection}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
