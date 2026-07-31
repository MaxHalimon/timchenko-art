/**
 * Single source of truth for supported locales.
 * To add a new language later: add its code here, add messages/<code>.json,
 * and add a label in LOCALE_LABELS — nothing else needs to change.
 */
export const locales = ["uk", "en", "de", "fr", "ja"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uk";

export const LOCALE_LABELS: Record<Locale, string> = {
  uk: "Українська",
  en: "English",
  de: "Deutsch",
  ja: "日本語",
  fr: "Français",
};
