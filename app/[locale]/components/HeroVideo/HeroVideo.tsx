"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { HeroManifestoOverlay } from "../HeroManifestoOverlay/HeroManifestoOverlay";
import styles from "./HeroVideo.module.css";

export function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const t = useTranslations("common");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    // Some browsers (notably iOS Safari) won't honor the autoPlay attribute
    // reliably unless play() is also called explicitly once mounted.
    if (!reducedMotion) {
      videoRef.current?.play().catch(() => {
        // Autoplay can still be blocked (e.g. low-power mode) — the poster
        // frame stays visible in that case, which is a fine fallback.
      });
    }
  }, [reducedMotion]);

  function scrollToNextSection() {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  }

  return (
    <div className={styles.hero} data-hero-video>
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        poster={poster}
        // Muted is required for autoplay in every major browser, and this
        // video has no audio track anyway (stripped during compression).
        muted
        loop={!reducedMotion}
        autoPlay={!reducedMotion}
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* Uniform darkening film across the whole video — like tinted car
          glass, not a bottom-only gradient — so the typed text stays
          readable no matter where it sits over the loop. */}
      <div className={styles.tint} aria-hidden="true" />

      <HeroManifestoOverlay />

      <button type="button" className={styles.scrollCue} aria-label={t("scrollHint")} onClick={scrollToNextSection}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
