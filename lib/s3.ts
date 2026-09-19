import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 is S3-API-compatible, so the standard AWS SDK works
 * against it unmodified — we just point `endpoint` at R2 instead of AWS,
 * and always use region "auto" (R2 doesn't have real regions).
 *
 * Two buckets, two access patterns:
 *  - previews  (S3_PREVIEWS_BUCKET)  — public, served straight to every
 *    visitor in the gallery. Uploaded once via
 *    scripts/upload-paintings-to-r2.ts, then referenced by a public URL
 *    (S3_PREVIEWS_PUBLIC_URL/<key>) stored directly in
 *    Product.previewImageKey.
 *  - originals (S3_ORIGINALS_BUCKET) — private, full-resolution files.
 *    Nothing reads these directly; a customer only gets to one via a
 *    short-lived presigned URL (see getPresignedOriginalUrl below),
 *    generated after their order is PAID. That consumer flow (an
 *    email link or account page offering the download) isn't built yet
 *    — this client is ready for it when it is.
 */

const accountId = process.env.S3_ACCOUNT_ID;

export const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

export async function uploadObject(bucket: string, key: string, body: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/**
 * Not used yet (see file header) — here so the "buy → email a download
 * link" flow can be wired up later without touching the storage layer.
 */
export async function getPresignedOriginalUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const bucket = process.env.S3_ORIGINALS_BUCKET;
  if (!bucket) throw new Error("S3_ORIGINALS_BUCKET is not set");
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}
