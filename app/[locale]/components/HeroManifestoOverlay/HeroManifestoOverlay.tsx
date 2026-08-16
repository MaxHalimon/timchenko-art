"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./HeroManifestoOverlay.module.css";

const MS_PER_CHAR = 38;

/**
 * A short, distinct artist's-statement — deliberately *not* the same
 * message as ManifestoStatement (gallery vs. commission) or ArtistIntro
 * (the full biography) further down the page. This one lives only here,
 * typed out over the hero video as if written by hand in the moment.
 *
 * Typing is driven by a plain interval advancing a character count,
 * rather than a CSS `steps()` width animation — a JS interval lets the
 * cadence stay 1 char / MS_PER_CHAR regardless of how long the string
 * is or how the text reflows across lines, which a fixed-duration CSS
 * animation can't guarantee. `prefers-reduced-motion` skips straight to
 * the full text. Screen readers get the full text immediately too (in a
 * visually-hidden node) — the letter-by-letter reveal is a visual effect
 * only, not something assistive tech should have to sit through.
 */
export function HeroManifestoOverlay() {
  const t = useTranslations("heroManifesto");
  const text = t("text");
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    // Reset on every (re-)mount, including React StrictMode's dev-only
    // mount → cleanup → mount cycle — a "only run once" ref guard here
    // would block that second, real mount from ever starting a timer.
    // The cleanup below already handles not double-running: it clears
    // whichever interval belongs to that particular effect invocation.
    setVisibleChars(0);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setVisibleChars(text.length);
      return;
    }

    let count = 0;
    const id = setInterval(() => {
      count += 1;
      setVisibleChars(count);
      if (count >= text.length) clearInterval(id);
    }, MS_PER_CHAR);

    return () => clearInterval(id);
  }, [text]);

  const isDone = visibleChars >= text.length;

  return (
    <div className={styles.wrapper}>
      <p className={styles.visible} aria-hidden="true">
        {text.slice(0, visibleChars)}
        <span className={isDone ? `${styles.cursor} ${styles.cursorSteady}` : styles.cursor} />
      </p>
      <p className={styles.srOnly}>{text}</p>
    </div>
  );
}
