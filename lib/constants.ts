/**
 * Global business constants. Keep these here — a single source of truth,
 * not scattered magic numbers in routes/components.
 */

/**
 * Platform's cut on every sale — this is the site owner's own earnings for
 * running/operating the site. Fixed, does not vary per product or order.
 * The remaining (100 - this)% is what gets paid out to the artist.
 */
export const PLATFORM_COMMISSION_PCT = 20;

export function calculatePlatformCommissionEur(amountEur: number): number {
  return Math.round(amountEur * (PLATFORM_COMMISSION_PCT / 100) * 100) / 100;
}

/** What the artist is owed for a given sale — amount minus the platform's cut. */
export function calculateArtistPayoutEur(amountEur: number): number {
  return Math.round((amountEur - calculatePlatformCommissionEur(amountEur)) * 100) / 100;
}

/**
 * "Last updated" date shown on all four legal pages (privacy, terms,
 * shipping, returns). Single source of truth: bump this one line whenever
 * ANY policy text in messages/*.json is changed, and every page and every
 * language picks it up. Format: YYYY-MM-DD (rendered per locale by
 * app/[locale]/components/LegalPage/LegalPage.tsx).
 */
export const LEGAL_LAST_UPDATED = "2026-10-01";

/** Public preview images are clean; originals remain private-bucket only. */
export const S3_BUCKETS = {
  previews: process.env.S3_PREVIEWS_BUCKET ?? "timchenko-art-previews",
  originals: process.env.S3_ORIGINALS_BUCKET ?? "timchenko-art-originals",
} as const;

/** How long a presigned URL to the original artwork stays valid. */
export const PRESIGNED_URL_TTL_SECONDS = 60 * 15; // 15 minutes

/**
 * Returns are accepted for this many days after the customer receives the
 * painting (see legal.returnsRefunds in messages/*.json — keep both in sync).
 * The commission report treats an order's 20% as "due" only after this window
 * has closed, so commission isn't claimed on an order that may still be returned.
 */
export const RETURN_WINDOW_DAYS = 14;

/**
 * Canvas print of ANY painting in the catalog (same image, printed at a print
 * shop — not hand-painted). One flat price for every painting, for the SAME size as the original;
 * a different size is quoted individually (agreed with the customer by message).
 * Shown on the product page, in the gallery and on the home page; all copy
 * lives in messages/*.json → "print". Change the number here, nowhere else.
 */
export const PRINT_PRICE_EUR = 300;

/** Production time of a canvas print, in days (shown to the customer). */
export const PRINT_PRODUCTION_DAYS = 5;

/** After production, a print is shipped within this many business days. */
export const PRINT_DISPATCH_DAYS = 5;

/** "Originals from ..." price shown in the print card on the gallery page. */
export const ORIGINALS_FROM_EUR = 1000;

/** Hand-painted work takes this long (days) — shown in the easel; keep in sync with legal.shippingPolicy. */
export const HANDMADE_DAYS_MIN = 15;
export const HANDMADE_DAYS_MAX = 30;

/** Largest quantity of one line (same painting, same variant) in a single order. */
export const MAX_OIL_QUANTITY = 10;
export const MAX_PRINT_QUANTITY = 20;
