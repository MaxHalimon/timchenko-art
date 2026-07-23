"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./BackToTop.module.css";

const SHOW_AFTER_PX = 400; // roughly "scrolled past the hero"

export function BackToTop() {
  const t = useTranslations("backToTop");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }

    handleScroll(); // set correct state on mount (e.g. after a page reload mid-scroll)
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      aria-label={t("label")}
      onClick={scrollToTop}
      className={visible ? `${styles.button} ${styles.visible}` : styles.button}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 19V5M12 5L5 12M12 5l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
