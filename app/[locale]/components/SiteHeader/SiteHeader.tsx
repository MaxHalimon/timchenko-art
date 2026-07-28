"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { CurrencySwitcher } from "../CurrencySwitcher/CurrencySwitcher";
import { useEasel } from "../../providers/EaselProvider";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  const t = useTranslations("common");
  const [menuOpen, setMenuOpen] = useState(false);
  const { slugs } = useEasel();
  const pathname = usePathname();

  function closeMenu() {
    setMenuOpen(false);
  }

  function linkClass(href: string) {
    return pathname === href ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;
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
        aria-controls="site-nav"
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

      <nav id="site-nav" className={menuOpen ? `${styles.nav} ${styles.navOpen}` : styles.nav}>
        <Link href="/" className={linkClass("/")} onClick={closeMenu}>
          {t("nav.home")}
        </Link>
        <Link href="/gallery" className={linkClass("/gallery")} onClick={closeMenu}>
          {t("nav.gallery")}
        </Link>
        <Link href="/tracking" className={linkClass("/tracking")} onClick={closeMenu}>
          {t("nav.tracking")}
        </Link>
        <Link href="/contacts" className={linkClass("/contacts")} onClick={closeMenu}>
          {t("nav.contact")}
        </Link>
        <Link href="/easel" className={linkClass("/easel")} onClick={closeMenu}>
          {t("nav.easel")}
          {slugs.length > 0 && <span className={styles.easelCount}>{slugs.length}</span>}
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
