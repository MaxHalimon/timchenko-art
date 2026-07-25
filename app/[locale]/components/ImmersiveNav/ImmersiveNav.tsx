"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { CurrencySwitcher } from "../CurrencySwitcher/CurrencySwitcher";
import styles from "./ImmersiveNav.module.css";

/**
 * Homepage-only nav: logo + hamburger, transparent over the hero image,
 * with the full nav tucked into a compact dropdown regardless of screen
 * width — unlike SiteHeader, which shows an inline nav on desktop. This
 * keeps the homepage's first screen free of a visible menu bar per the
 * "manifesto" brief, while still giving full navigation one click away.
 *
 * Stays fixed on screen while scrolling (like SiteHeader elsewhere), and
 * switches from a transparent overlay to a solid background exactly when
 * the video hero block (marked with data-hero-video) scrolls out of view —
 * a transparent header with light text would be unreadable once the page
 * underneath turns white.
 */
export function ImmersiveNav() {
  const t = useTranslations("common");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const heroEl = document.querySelector("[data-hero-video]");
      if (heroEl) {
        setScrolled(heroEl.getBoundingClientRect().bottom <= 0);
      } else {
        setScrolled(window.scrollY > 40);
      }
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className={scrolled ? `${styles.header} ${styles.headerSolid}` : styles.header}>
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <nav id="immersive-nav" className={menuOpen ? `${styles.nav} ${styles.navOpen}` : styles.nav}>
        <Link href="/" className={styles.navLink} onClick={closeMenu}>
          {t("nav.home")}
        </Link>
        <Link href="/gallery" className={styles.navLink} onClick={closeMenu}>
          {t("nav.gallery")}
        </Link>
        <Link href="/shipping-policy" className={styles.navLink} onClick={closeMenu}>
          {t("nav.tracking")}
        </Link>
        <Link href="/contacts" className={styles.navLink} onClick={closeMenu}>
          {t("nav.contact")}
        </Link>
        <div className={styles.navDivider} />
        <div className={styles.switchers}>
          <LanguageSwitcher />
          <CurrencySwitcher />
        </div>
      </nav>
    </header>
  );
}
