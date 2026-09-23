"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ImageSlideshowModal } from "../ImageSlideshowModal/ImageSlideshowModal";
import styles from "./FocusCardModal.module.css";

export interface FocusCardImage {
  slug: string;
  title: string;
  /** Not tracked in the data model yet — renders only if/when it exists. */
  year?: number | null;
  previewImageUrl: string;
  widthCm?: number;
  heightCm?: number;
  material?: string;
  priceEur?: number;
}

/**
 * "Card with focus" pattern for the home page showcase: a light,
 * mid-sized popup — not a full-screen viewer — meant to tease interest
 * (bigger look at the piece, its name) and nudge toward the gallery for
 * the full experience (slideshow, zoom, filtering), rather than pulling
 * the visitor away from the home page into something heavier.
 */
export function FocusCardModal({ image, onClose }: { image: FocusCardImage; onClose: () => void }) {
  const t = useTranslations("focusCard");
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerElement = useRef<Element | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (fullscreen) return; // let ImageSlideshowModal's own handler close itself first
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, fullscreen]);

  return (
    <>
      <div
        className={styles.overlay}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={image.title} tabIndex={-1} className={styles.dialog}>
          <button type="button" className={styles.closeButton} aria-label={t("close")} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className={styles.scrollArea}>
            {/* The preview is watermarked and this is already its full
                resolution (lib/... never serves the private original to
                the browser) — "fullscreen" here means filling the
                viewport at that same resolution, not a higher-quality
                asset. See Product.originalImageKey's own comment in
                schema.prisma: that file is private-bucket only. */}
            <button
              type="button"
              className={styles.imageWrapper}
              onClick={() => setFullscreen(true)}
              aria-label={t("viewFullscreen")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.previewImageUrl} alt={image.title} className={styles.image} />
            </button>

            <div className={styles.info}>
              <h3 className={styles.title}>{image.title}</h3>
              {image.year && <p className={styles.year}>{image.year}</p>}
              <Link href={`/product/${image.slug}`} className={styles.viewLink} onClick={onClose}>
                {t("viewInGallery")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {fullscreen && (
        <ImageSlideshowModal
          images={[
            {
              slug: image.slug,
              title: image.title,
              previewImageUrl: image.previewImageUrl,
              widthCm: image.widthCm,
              heightCm: image.heightCm,
              material: image.material,
              priceEur: image.priceEur,
            },
          ]}
          initialIndex={0}
          onClose={() => setFullscreen(false)}
        />
      )}
    </>
  );
}
