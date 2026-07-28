"use client";

import { useTranslations } from "next-intl";
import { useEasel } from "../../providers/EaselProvider";
import styles from "./EaselButton.module.css";

export function EaselButton({ slug, disabled }: { slug: string; disabled?: boolean }) {
  const t = useTranslations("easel");
  const { isOnEasel, addToEasel, removeFromEasel } = useEasel();
  const active = isOnEasel(slug);

  function handleClick(event: React.MouseEvent) {
    // Prevent bubbling up to a surrounding <Link> (ProductCard wraps its
    // media/title in one) so clicking this button never navigates away.
    event.preventDefault();
    event.stopPropagation();
    if (active) {
      removeFromEasel(slug);
    } else {
      addToEasel(slug);
    }
  }

  if (disabled) {
    return (
      <button type="button" className={styles.button} disabled>
        {t("unavailable")}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={active ? `${styles.button} ${styles.buttonActive}` : styles.button}
      onClick={handleClick}
    >
      {active ? t("onEasel") : t("add")}
    </button>
  );
}
