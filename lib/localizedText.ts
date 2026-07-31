import { defaultLocale } from "@/i18n/config";

/**
 * Product.title is stored as JSON mapping locale -> text, e.g.
 * { "uk": "Бурштинова тиша", "en": "Amber Silence", ... } — one name per
 * storefront language, rather than a single untranslated string.
 *
 * Resolution order: requested locale -> defaultLocale (uk) -> first
 * non-empty value present -> empty string. The fallback chain matters
 * because a painting can exist before every language's translation has
 * been filled in yet (e.g. right after an Excel import that only had one
 * language column).
 *
 * Also accepts a plain string for backward compatibility with any
 * not-yet-migrated data — used as-is regardless of locale in that case.
 */
export function localizedText(value: unknown, locale: string): string {
  // Defensive fallback: if a stale Prisma Client wrote this field before
  // `prisma generate` picked up the Json type (e.g. right after the
  // migration, before regenerating), it may have serialized the whole
  // { uk: "...", en: "...", ... } object into a literal JSON *string*
  // instead of storing it as a real JSON object. Detect that shape and
  // parse it once so existing rows still resolve correctly without
  // requiring a reseed.
  if (typeof value === "string" && value.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return localizedText(parsed, locale);
      }
    } catch {
      // Not actually JSON — fall through and treat it as a plain string below.
    }
  }

  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const map = value as Record<string, unknown>;
    if (typeof map[locale] === "string" && map[locale]) return map[locale] as string;
    if (typeof map[defaultLocale] === "string" && map[defaultLocale]) return map[defaultLocale] as string;
    const firstString = Object.values(map).find((v): v is string => typeof v === "string" && v.length > 0);
    if (firstString) return firstString;
  }

  return "";
}
