"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MAX_OIL_QUANTITY, MAX_PRINT_QUANTITY } from "@/lib/constants";

const EASEL_STORAGE_KEY = "timchenko-art:easel";

/** "oil" = hand-painted oil on canvas (the original, or a repainted copy); "print" = canvas print. */
export type EaselVariant = "oil" | "print";

export interface EaselLine {
  slug: string;
  variant: EaselVariant;
  quantity: number;
}

export const maxQuantity = (variant: EaselVariant) => (variant === "oil" ? MAX_OIL_QUANTITY : MAX_PRINT_QUANTITY);

interface EaselContextValue {
  lines: EaselLine[];
  /** Unique painting slugs on the easel (what the page needs to fetch). */
  slugs: string[];
  /** Total number of pieces (sum of quantities) — the badge in the header. */
  count: number;
  hydrated: boolean;
  addToEasel: (slug: string, variant?: EaselVariant) => void;
  removeFromEasel: (slug: string, variant?: EaselVariant) => void;
  setQuantity: (slug: string, variant: EaselVariant, quantity: number) => void;
  isOnEasel: (slug: string, variant?: EaselVariant) => boolean;
  clearEasel: () => void;
}

const EaselContext = createContext<EaselContextValue | null>(null);

/** Reads what an older version stored (a plain list of slugs) as well as the current line format. */
function parseStored(raw: string | null): EaselLine[] {
  if (!raw) return [];
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) return [];

  const lines: EaselLine[] = [];
  for (const entry of data) {
    if (typeof entry === "string") {
      lines.push({ slug: entry, variant: "oil", quantity: 1 }); // legacy format
    } else if (entry && typeof entry.slug === "string" && (entry.variant === "oil" || entry.variant === "print")) {
      const quantity = Math.min(Math.max(Math.trunc(Number(entry.quantity)) || 1, 1), maxQuantity(entry.variant));
      lines.push({ slug: entry.slug, variant: entry.variant, quantity });
    }
  }
  return lines;
}

/**
 * "Мольберт" (the easel) — this site's cart, on purpose not called or
 * styled like a marketplace cart. No account needed: the selection lives
 * in localStorage on this browser. One easel can mix oil paintings and
 * prints, several of each, and is paid in a single payment.
 */
export function EaselProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<EaselLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read persisted state after mount only — avoids a hydration mismatch,
  // since localStorage isn't available during server rendering.
  useEffect(() => {
    try {
      setLines(parseStored(window.localStorage.getItem(EASEL_STORAGE_KEY)));
    } catch {
      // Corrupted or inaccessible storage — start with an empty easel
      // rather than breaking the page.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // don't overwrite storage with the initial empty state
    window.localStorage.setItem(EASEL_STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const same = (line: EaselLine, slug: string, variant: EaselVariant) => line.slug === slug && line.variant === variant;

  function addToEasel(slug: string, variant: EaselVariant = "oil") {
    setLines((current) =>
      current.some((line) => same(line, slug, variant)) ? current : [...current, { slug, variant, quantity: 1 }],
    );
  }

  function removeFromEasel(slug: string, variant: EaselVariant = "oil") {
    setLines((current) => current.filter((line) => !same(line, slug, variant)));
  }

  function setQuantity(slug: string, variant: EaselVariant, quantity: number) {
    const clamped = Math.min(Math.max(Math.trunc(quantity) || 1, 1), maxQuantity(variant));
    setLines((current) => current.map((line) => (same(line, slug, variant) ? { ...line, quantity: clamped } : line)));
  }

  function isOnEasel(slug: string, variant: EaselVariant = "oil") {
    return lines.some((line) => same(line, slug, variant));
  }

  function clearEasel() {
    setLines([]);
  }

  const slugs = Array.from(new Set(lines.map((line) => line.slug)));
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <EaselContext.Provider
      value={{ lines, slugs, count, hydrated, addToEasel, removeFromEasel, setQuantity, isOnEasel, clearEasel }}
    >
      {children}
    </EaselContext.Provider>
  );
}

export function useEasel() {
  const ctx = useContext(EaselContext);
  if (!ctx) {
    throw new Error("useEasel must be used within an EaselProvider");
  }
  return ctx;
}
