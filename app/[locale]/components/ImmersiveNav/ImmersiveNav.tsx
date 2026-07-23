"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { CurrencySwitcher } from "../CurrencySwitcher/CurrencySwitcher";
import styles from "./ImmersiveNav.module.css";

/**
 * Homepage-only nav: logo + hamburger, transparent over the hero image,
 * with the full nav tucked into a dropdown regardless of screen width —
 * unlike SiteHeader, which shows an inline nav on desktop. This keeps the
 * homepage's first screen free of a visible menu bar per the "manifesto"
 * brief, while still giving full navigation one click away.
 */
export function ImmersiveNav() {
  const t = useTranslations("common");
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo} onClick={closeMenu}>
        {t("siteName")}
      </Link>

      <button
        type="button"
        className={styles.hamburger}
        aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
        aria-expanded={menuOpen}
        aria-controls="immersive-nav"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <nav id="immersive-nav" className={menuOpen ? `${styles.nav} ${styles.navOpen}` : styles.nav}>
        <Link href="/catalog" onClick={closeMenu}>
          {t("nav.catalog")}
        </Link>
        <Link href="/#process" onClick={closeMenu}>
          {t("nav.process")}
        </Link>
        <Link href="/#delivery" onClick={closeMenu}>
          {t("nav.delivery")}
        </Link>
        <LanguageSwitcher />
        <CurrencySwitcher />
      </nav>
    </header>
  );
}
