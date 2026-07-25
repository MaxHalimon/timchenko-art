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

export function calculatePlatformCommissionUsd(amountUsd: number): number {
  return Math.round(amountUsd * (PLATFORM_COMMISSION_PCT / 100) * 100) / 100;
}

/** What the artist is owed for a given sale — amount minus the platform's cut. */
export function calculateArtistPayoutUsd(amountUsd: number): number {
  return Math.round((amountUsd - calculatePlatformCommissionUsd(amountUsd)) * 100) / 100;
}

/** Preview images always carry a watermark; originals are private-bucket only. */
export const S3_BUCKETS = {
  previews: process.env.S3_PREVIEWS_BUCKET ?? "timchenko-art-previews",
  originals: process.env.S3_ORIGINALS_BUCKET ?? "timchenko-art-originals",
} as const;

/** How long a presigned URL to the original artwork stays valid. */
export const PRESIGNED_URL_TTL_SECONDS = 60 * 15; // 15 minutes
