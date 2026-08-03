"use client";

import { useTranslations } from "next-intl";
import buttonStyles from "../components/shared/Buttons.module.css";
import styles from "./GalleryHero.module.css";

export interface HeroPainting {
  slug: string;
  title: string;
  previewImageUrl: string;
  widthCm: number;
  heightCm: number;
}

/**
 * "Стіна мистецтва" — a CSS-columns masonry wall (no JS layout library
 * needed: `columns` naturally flows items into balanced columns,
 * `break-inside: avoid` keeps each tile intact). Each tile keeps the
 * painting's real aspect ratio (from its actual cm dimensions), so the
 * "different sizes" look reflects the real paintings rather than
 * arbitrary placeholder shapes.
 *
 * Clicking a tile, or the CTA below the wall, launches exhibition mode —
 * a tile click also jumps straight to that painting.
 */
export function GalleryHero({ paintings, onLaunch }: { paintings: HeroPainting[]; onLaunch: (index: number) => void }) {
  const t = useTranslations("gallery");

  if (paintings.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.masonry}>
        {paintings.map((painting, i) => (
          <button
            type="button"
            key={painting.slug}
            className={styles.tile}
            style={{ aspectRatio: `${painting.widthCm} / ${painting.heightCm}` }}
            onClick={() => onLaunch(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={painting.previewImageUrl} alt={painting.title} className={styles.image} />
          </button>
        ))}
      </div>

      <div className={styles.ctaRow}>
        <button type="button" className={buttonStyles.galleryButton} onClick={() => onLaunch(0)}>
          👁️ {t("launchTour")}
        </button>
      </div>
    </div>
  );
}
