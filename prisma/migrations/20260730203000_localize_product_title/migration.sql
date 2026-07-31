-- Product.title: TEXT -> JSONB, so each painting can have a name per
-- storefront language ({ "uk": "...", "en": "...", "de": "...", "fr": "...", "ja": "..." }).
--
-- Existing plain-text values are wrapped as a JSON string (not an object)
-- via to_jsonb() — lib/localizedText.ts already handles that shape as a
-- fallback (uses it as-is regardless of locale) so nothing breaks for rows
-- not yet reseeded. Re-running `npm run prisma:seed` with an updated
-- prisma/paintings.json (title as a { locale: text } object) replaces
-- these with proper per-locale objects.
ALTER TABLE "products" ALTER COLUMN "title" TYPE JSONB USING to_jsonb("title");
