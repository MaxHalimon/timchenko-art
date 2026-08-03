"use client";

import { useTranslations } from "next-intl";
import styles from "./ViewSwitcher.module.css";

export type GalleryMode = "exhibition" | "grid";

export function ViewSwitcher({ mode, onChange }: { mode: GalleryMode; onChange: (mode: GalleryMode) => void }) {
  const t = useTranslations("gallery");

  return (
    <div className={styles.switcher} role="group" aria-label={t("viewExhibition")}>
      <button
        type="button"
        className={mode === "exhibition" ? `${styles.option} ${styles.optionActive}` : styles.option}
        onClick={() => onChange("exhibition")}
        aria-pressed={mode === "exhibition"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="18" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 16l4.5-5 3.5 4 3-3.5L21 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("viewExhibition")}
      </button>
      <button
        type="button"
        className={mode === "grid" ? `${styles.option} ${styles.optionActive}` : styles.option}
        onClick={() => onChange("grid")}
        aria-pressed={mode === "grid"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        {t("viewGrid")}
      </button>
    </div>
  );
}
