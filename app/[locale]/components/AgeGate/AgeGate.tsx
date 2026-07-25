"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./AgeGate.module.css";
import buttonStyles from "../shared/Buttons.module.css";

const STORAGE_KEY = "timchenko-art:age-verified";

export function AgeGate() {
  const t = useTranslations("ageGate");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only runs client-side; avoids hydration mismatch by starting hidden.
    const verified = window.localStorage.getItem(STORAGE_KEY);
    if (verified !== "true") {
      setVisible(true);
    }
  }, []);

  function confirmAge() {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }

  function declineAge() {
    window.location.href = "https://www.google.com";
  }

  if (!visible) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="age-gate-title" className={styles.overlay}>
      <div className={styles.dialog}>
        <h2 id="age-gate-title" className={styles.title}>
          {t("title")}
        </h2>
        <p className={styles.description}>{t("description")}</p>
        <div className={styles.actions}>
          <button className={buttonStyles.galleryButton} onClick={confirmAge}>
            {t("confirm")}
          </button>
          <button className={buttonStyles.galleryButtonOutline} onClick={declineAge}>
            {t("decline")}
          </button>
        </div>
      </div>
    </div>
  );
}
