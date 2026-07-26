"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AmbientBackground.module.css";

// Simple line-art icons of artist-studio objects. Rendered in the current
// text color (dark) at 50% opacity via the wrapper, so they read as a
// faint grayscale pattern regardless of which icon is picked.
function PaintbrushIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" width="100%" height="100%">
      <path d="M33 6 20 19a4 4 0 0 0 0 6l3 3a4 4 0 0 0 6 0L42 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 25 9 36a4 4 0 1 0 6 6l11-11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 36c-2-3-2-6 1-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function EaselIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" width="100%" height="100%">
      <path d="M10 42 24 6l14 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 42h36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="14" y="16" width="20" height="15" rx="1" stroke="currentColor" strokeWidth="2" />
      <path d="M24 31v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" width="100%" height="100%">
      <path
        d="M24 6C13 6 5 14 5 24c0 6 4 9 8 9 2 0 3-1 3-3 0-3 3-3 5-3h9c4 0 8-3 8-9 0-7-6-12-14-12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="19" r="2" fill="currentColor" />
      <circle cx="24" cy="14" r="2" fill="currentColor" />
      <circle cx="32" cy="19" r="2" fill="currentColor" />
    </svg>
  );
}

function FrameIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" width="100%" height="100%">
      <rect x="7" y="7" width="34" height="34" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="13" width="22" height="22" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 28l5-6 4 4 5-7 4 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" width="100%" height="100%">
      <path d="M10 38 32 16l6 6-22 22H10v-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M27 21l6 6" stroke="currentColor" strokeWidth="2" />
      <path d="M32 16l4-4a3 3 0 0 1 4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// Classic, instantly-recognizable brush silhouette (outline style, matching
// the rest of the icon set): a rounded rectangular handle, a wider ferrule
// band, and a teardrop bristle tip — assembled from simple shapes (not one
// freeform curve) and rotated 45° for the diagonal handle-to-tip look.
function ClassicBrushIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" width="100%" height="100%">
      <g transform="rotate(45 24 24)">
        <rect x="21" y="1" width="6" height="25" rx="3" stroke="currentColor" strokeWidth="2" />
        <rect x="19" y="25" width="10" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
        <path
          d="M19 29C17 36 18 42 24 46 30 42 31 36 29 29Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

// Rectangular (non-square) picture frame — same family as FrameIcon above
// but in a horizontal (landscape) ratio, for visual variety among the
// frame icons.
function RectangleFrameIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" width="100%" height="100%">
      <rect x="4" y="12" width="40" height="24" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="9" y="17" width="30" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="24" r="2" fill="currentColor" />
      <path d="M12 29l6-4 3 3 7-4 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = [PaintbrushIcon, EaselIcon, PaletteIcon, FrameIcon, PencilIcon, ClassicBrushIcon, RectangleFrameIcon];
const GRID_COLS = 4;
const GRID_ROWS = 6;
const REPEL_RADIUS = 140;
const REPEL_STRENGTH = 20;

interface IconInstance {
  Icon: (typeof ICONS)[number];
  top: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Purely decorative — mounted once in the root layout, sits behind all
 * page content (negative z-index) and never intercepts clicks
 * (pointer-events: none on the container). Renders nothing until mounted:
 * the layout is randomized client-side, so rendering it during SSR would
 * either mismatch on hydration or require sending a fixed "random" layout
 * baked into the HTML — skipping the server pass entirely avoids both.
 *
 * Placement uses a jittered grid (one icon per cell, nudged randomly
 * within that cell) rather than pure random x/y — plain randomness tends
 * to cluster and leave empty patches for a small icon count; a jittered
 * grid guarantees even coverage across the full page height while still
 * looking organic rather than a rigid grid.
 */
export function AmbientBackground() {
  const [icons, setIcons] = useState<IconInstance[] | null>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cells: Array<{ row: number; col: number }> = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        cells.push({ row, col });
      }
    }

    setIcons(
      shuffle(cells).map(({ row, col }) => {
        const cellWidth = 100 / GRID_COLS;
        const cellHeight = 100 / GRID_ROWS;
        // Jitter within the cell (keeping some margin from the cell edges
        // so icons never sit exactly on the boundary between two cells).
        const jitterX = 0.2 + Math.random() * 0.6;
        const jitterY = 0.2 + Math.random() * 0.6;

        return {
          Icon: ICONS[Math.floor(Math.random() * ICONS.length)],
          left: col * cellWidth + jitterX * cellWidth,
          top: row * cellHeight + jitterY * cellHeight,
          size: 32 + Math.random() * 36,
          duration: 14 + Math.random() * 10,
          delay: Math.random() * -20,
          rotate: Math.random() * 40 - 20,
        };
      })
    );
  }, []);

  useEffect(() => {
    if (!icons) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    let pending = false;
    let mouseX = -9999;
    let mouseY = -9999;

    function applyRepel() {
      pending = false;
      for (const el of iconRefs.current) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - mouseX;
        const dy = cy - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          const angle = Math.atan2(dy, dx);
          el.style.setProperty("--repel-x", `${Math.cos(angle) * force}px`);
          el.style.setProperty("--repel-y", `${Math.sin(angle) * force}px`);
        } else {
          el.style.setProperty("--repel-x", "0px");
          el.style.setProperty("--repel-y", "0px");
        }
      }
    }

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!pending) {
        pending = true;
        rafId = requestAnimationFrame(applyRepel);
      }
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [icons]);

  if (!icons) return null;

  return (
    <div className={styles.container} aria-hidden="true">
      {icons.map((instance, i) => {
        const { Icon } = instance;
        return (
          <div
            key={i}
            className={styles.floatWrapper}
            style={{
              top: `${instance.top}%`,
              left: `${instance.left}%`,
              width: instance.size,
              height: instance.size,
              animationDuration: `${instance.duration}s`,
              animationDelay: `${instance.delay}s`,
            }}
          >
            <div
              ref={(el) => {
                iconRefs.current[i] = el;
              }}
              className={styles.repelWrapper}
              style={{ ["--icon-rotate" as string]: `${instance.rotate}deg` }}
            >
              <Icon />
            </div>
          </div>
        );
      })}
    </div>
  );
}
