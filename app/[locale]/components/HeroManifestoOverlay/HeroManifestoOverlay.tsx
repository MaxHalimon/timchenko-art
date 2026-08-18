"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./HeroManifestoOverlay.module.css";

const START_DELAY_MS = 2000; // cursor blinks alone for 2s before typing starts
const MS_PER_CHAR = 60;
const HOLD_AFTER_DONE_MS = 5000; // full text stays up 5s after the last letter
const FADE_OUT_MS = 1200; // must match the CSS transition duration below

type Phase = "pending" | "typing" | "holding" | "cursorFadingOut" | "cursorHidden";

// Space-delimited languages (uk/en/de/fr/…) split cleanly into words. CJK
// text (ja) has no spaces between words at all, so a plain `.split(" ")`
// returns the *entire string* as one "word" — which then makes the whole
// sentence count as the single accented word (100% of the text colored,
// which is the bug being fixed here). Approximate "words" for that case as
// 2-character clusters instead, so accenting a handful of tokens still
// reads as a light sprinkling rather than an all-or-nothing choice.
function tokenize(text: string): { tokens: string[]; separator: string } {
  if (text.includes(" ")) return { tokens: text.split(" "), separator: " " };
  const chars = Array.from(text);
  const tokens: string[] = [];
  for (let i = 0; i < chars.length; i += 2) tokens.push(chars.slice(i, i + 2).join(""));
  return { tokens, separator: "" };
}

// Randomized on purpose (Math.random(), not a hash of the text) — a
// different 3-4 words light up on every page load. min/max are inclusive.
function pickAccentedTokens(tokenCount: number, min = 3, max = 4): Set<number> {
  const accentCount = Math.min(tokenCount, Math.floor(Math.random() * (max - min + 1)) + min);
  const indices = new Set<number>();
  while (indices.size < accentCount) {
    indices.add(Math.floor(Math.random() * tokenCount));
  }
  return indices;
}

function renderTyped(text: string, visibleChars: number, accentedIndices: Set<number>) {
  const { tokens, separator } = tokenize(text);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const start = cursor;
    const end = start + token.length;
    cursor = end + separator.length;

    if (start >= visibleChars) break; // this token hasn't started appearing yet

    const segment = text.slice(start, Math.min(end, visibleChars));
    nodes.push(
      <span key={i}>
        {i > 0 ? separator : ""}
        {accentedIndices.has(i) ? <span className={styles.accent}>{segment}</span> : segment}
      </span>
    );
  }

  return nodes;
}

/**
 * A short, distinct artist's-statement — deliberately *not* the same
 * message as ManifestoStatement (gallery vs. commission) or ArtistIntro
 * (the full biography) further down the page. This one lives only here,
 * typed out over the hero video as if written by hand in the moment.
 *
 * Timeline: 2s of just a blinking cursor → types out at a steady
 * MS_PER_CHAR pace → holds for 5s with the cursor still blinking at the
 * end of the line → the cursor fades to invisible over FADE_OUT_MS and
 * stops blinking. The cursor element itself is never removed from the
 * DOM — it just ends up permanently at opacity 0, still occupying its
 * spot in the flow — rather than being unmounted, which would otherwise
 * cause a (tiny) layout shift right as it disappears. The typed text
 * itself is never removed either — only the cursor goes invisible,
 * since a permanently-blinking cursor next to finished text reads as
 * distracting rather than "still writing". `prefers-reduced-
 * motion` skips the typing (shows the full text immediately) but still honors the initial
 * delay and the hold-then-fade, so the text isn't just permanently stuck
 * on screen — it still behaves like a considered, disappearing statement
 * rather than a moving one. Screen readers get the full text immediately
 * via a visually-hidden node, independent of any of this timing.
 */
export function HeroManifestoOverlay() {
  const t = useTranslations("heroManifesto");
  const text = t("text");
  const [visibleChars, setVisibleChars] = useState(0);
  const [phase, setPhase] = useState<Phase>("pending");

  const accentedIndices = useMemo(() => {
    const { tokens } = tokenize(text);
    return pickAccentedTokens(tokens.length);
  }, [text]);

  useEffect(() => {
    setPhase("pending");
    setVisibleChars(0);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let typingInterval: ReturnType<typeof setInterval> | null = null;

    function startHoldThenFadeCursor() {
      setPhase("holding");
      timers.push(
        setTimeout(() => {
          setPhase("cursorFadingOut");
          timers.push(setTimeout(() => setPhase("cursorHidden"), FADE_OUT_MS));
        }, HOLD_AFTER_DONE_MS)
      );
    }

    timers.push(
      setTimeout(() => {
        if (reducedMotion) {
          setVisibleChars(text.length);
          startHoldThenFadeCursor();
          return;
        }

        setPhase("typing");
        let count = 0;
        typingInterval = setInterval(() => {
          count += 1;
          setVisibleChars(count);
          if (count >= text.length) {
            if (typingInterval) clearInterval(typingInterval);
            startHoldThenFadeCursor();
          }
        }, MS_PER_CHAR);
      }, START_DELAY_MS)
    );

    return () => {
      timers.forEach(clearTimeout);
      if (typingInterval) clearInterval(typingInterval);
    };
  }, [text]);

  const isDone = phase === "holding" || phase === "cursorFadingOut" || phase === "cursorHidden";

  return (
    <div className={styles.wrapper}>
      <p className={styles.visible} aria-hidden="true">
        {renderTyped(text, visibleChars, accentedIndices)}
        <span
          className={
            phase === "cursorFadingOut" || phase === "cursorHidden"
              ? `${styles.cursor} ${styles.cursorSteady} ${styles.cursorFadingOut}`
              : isDone
                ? `${styles.cursor} ${styles.cursorSteady}`
                : styles.cursor
          }
        />
      </p>
      <p className={styles.srOnly}>{text}</p>
    </div>
  );
}
