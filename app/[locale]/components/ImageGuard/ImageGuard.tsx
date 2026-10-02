"use client";

import { useEffect } from "react";

/**
 * Deterrent against casual saving of paintings: blocks the right-click
 * menu and drag-to-desktop on images/video. (Long-press "save image" on
 * mobile is blocked in globals.css via -webkit-touch-callout.)
 *
 * This is NOT real security - screenshots and DevTools can't be
 * stopped in a browser. The real protection is server-side: the
 * full-resolution master lives in a private bucket, while public
 * previews are intentionally size-capped and optimized for the web.
 */
export function ImageGuard() {
  useEffect(() => {
    const block = (e: Event) => {
      const el = e.target as Element | null;
      if (el?.closest?.("img, video")) e.preventDefault();
    };
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
    };
  }, []);

  return null;
}
