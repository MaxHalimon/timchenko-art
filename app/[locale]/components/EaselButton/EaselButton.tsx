"use client";

import { useTranslations } from "next-intl";
import { useEasel, type EaselVariant } from "../../providers/EaselProvider";
import styles from "./EaselButton.module.css";

export function EaselButton({
  slug,
  disabled,
  variant = "oil",
}: {
  slug: string;
  disabled?: boolean;
  /** "oil" (default) puts the painting on the easel, "print" puts a canvas print of it. */
  variant?: EaselVariant;
}) {
  const t = useTranslations("easel");
  const { isOnEasel, addToEasel, removeFromEasel } = useEasel();
  const active = isOnEasel(slug, variant);

  function handleClick(event: React.MouseEvent) {
    // Prevent bubbling up to a surrounding <Link> (ProductCard wraps its
    // media/title in one) so clicking this button never navigates away.
    event.preventDefault();
    event.stopPropagation();
    if (active) {
      removeFromEasel(slug, variant);
    } else {
      addToEasel(slug, variant);
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
      {variant === "print" ? (active ? t("printOnEasel") : t("addPrint")) : active ? t("onEasel") : t("add")}
    </button>
  );
}
