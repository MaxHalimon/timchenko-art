import manifest from "./media-manifest.json";

/**
 * Single source of truth for turning a stored object key into a URL.
 *
 * The DB stores RELATIVE keys ("paintings/<slug>/large-ab12cd34.webp"),
 * not full URLs, so moving to a custom domain (img.example.com) is a
 * one-line env change instead of a data migration.
 *
 * Legacy values keep working, which makes rollout safe:
 *  - "https://..." full URLs are returned untouched;
 *  - "/paintings/x.jpg" local paths are returned untouched.
 *
 * Server-side only (reads S3_PREVIEWS_PUBLIC_URL); pages/route handlers
 * call it and hand ready URLs to client components.
 */
export function mediaUrl(key: string | null | undefined): string {
  if (!key) return "";
  if (/^https?:\/\//i.test(key) || key.startsWith("/")) return key;
  const base = (process.env.S3_PREVIEWS_PUBLIC_URL ?? "").replace(/\/+$/, "");
  if (!base) {
    console.error(`[media] S3_PREVIEWS_PUBLIC_URL is not set - cannot resolve image key "${key}"`);
    return "";
  }
  return `${base}/${key.replace(/^\/+/, "")}`;
}

/** URLs for a product row; thumb falls back to the large image. */
export function productImages(p: { previewImageKey: string; thumbImageKey?: string | null }) {
  const previewImageUrl = mediaUrl(p.previewImageKey);
  return { previewImageUrl, thumbImageUrl: p.thumbImageKey ? mediaUrl(p.thumbImageKey) : previewImageUrl };
}

/** Hero video URL from the manifest written by `npm run media:upload`. */
export function heroVideoUrl(): string | undefined {
  const key = (manifest as { video?: string | null }).video;
  return key ? mediaUrl(key) : undefined;
}
