"use client";

import styles from "./CurtainTransition.module.css";

/**
 * A brief (~900ms total) theater-curtain effect: two panels slide in from
 * left/right to fully cover the screen ("closing"), then — once the new
 * content is already swapped in underneath — slide back out ("open").
 * The content swap itself (new random painting + autoplay on) happens
 * while the screen is covered, so what the visitor sees is a clean
 * cinematic reveal rather than an abrupt jump-cut. See GalleryView's
 * handleLaunchTour for the timing that drives `phase`.
 */
export function CurtainTransition({ phase }: { phase: "closing" | "open" }) {
  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={phase === "closing" ? styles.panelLeftIn : styles.panelLeftOut} />
      <div className={phase === "closing" ? styles.panelRightIn : styles.panelRightOut} />
    </div>
  );
}
