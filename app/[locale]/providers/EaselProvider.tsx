"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const EASEL_STORAGE_KEY = "timchenko-art:easel";

interface EaselContextValue {
  slugs: string[];
  addToEasel: (slug: string) => void;
  removeFromEasel: (slug: string) => void;
  isOnEasel: (slug: string) => boolean;
  clearEasel: () => void;
}

const EaselContext = createContext<EaselContextValue | null>(null);

/**
 * "Мольберт" (the easel) — this site's cart, on purpose not called or
 * styled like a marketplace cart. No account needed: the selection lives
 * in localStorage on this browser, the same pattern as a normal cart,
 * just under different naming/theming. Checkout still asks for
 * name/email/address as a guest, same as the existing single-item flow.
 */
export function EaselProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read persisted state after mount only — avoids a hydration mismatch,
  // since localStorage isn't available during server rendering.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(EASEL_STORAGE_KEY);
      if (raw) setSlugs(JSON.parse(raw));
    } catch {
      // Corrupted or inaccessible storage — start with an empty easel
      // rather than breaking the page.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // don't overwrite storage with the initial empty state
    window.localStorage.setItem(EASEL_STORAGE_KEY, JSON.stringify(slugs));
  }, [slugs, hydrated]);

  function addToEasel(slug: string) {
    setSlugs((current) => (current.includes(slug) ? current : [...current, slug]));
  }

  function removeFromEasel(slug: string) {
    setSlugs((current) => current.filter((s) => s !== slug));
  }

  function isOnEasel(slug: string) {
    return slugs.includes(slug);
  }

  function clearEasel() {
    setSlugs([]);
  }

  return (
    <EaselContext.Provider value={{ slugs, addToEasel, removeFromEasel, isOnEasel, clearEasel }}>
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
