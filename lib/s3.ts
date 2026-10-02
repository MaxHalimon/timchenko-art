import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 is S3-API-compatible, so the standard AWS SDK works
 * against it - we point `endpoint` at R2 and always use region "auto".
 *
 * Two buckets, two access patterns:
 *  - previews  (S3_PREVIEWS_BUCKET)   PUBLIC. Holds ONLY watermarked,
 *    size-capped WebP files (thumb + large) and the hero video. Uploaded
 *    by scripts/upload-media.ts; the DB stores the relative object key
 *    (see lib/media.ts), never a full URL.
 *  - originals (S3_ORIGINALS_BUCKET)  PRIVATE. Full-resolution source
 *    scans, kept as the master copy for print production / backup.
 *    Nothing on the site serves these - paintings are sold as physical
 *    canvases, so a customer never downloads a file.
 */

let client: S3Client | undefined;

/**
 * Created lazily on first use, NOT at import time: scripts load .env
 * after their imports are evaluated, and a client built too early would
 * silently miss S3_ACCOUNT_ID and talk to real AWS instead of R2.
 */
export function getS3(): S3Client {
  if (!client) {
    const accountId = process.env.S3_ACCOUNT_ID;
    client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
      // Recent AWS SDK versions add CRC32 checksums to every request by
      // default, which R2 rejects/handles inconsistently. Only send them
      // when an operation strictly requires it (Cloudflare's recommendation).
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}

export async function uploadObject(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
  cacheControl?: string,
) {
  await getS3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );
}

export async function objectExists(bucket: string, key: string): Promise<boolean> {
  try {
    await getS3().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404) return false;
    throw err;
  }
}

export async function listKeys(bucket: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await getS3().send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
    for (const o of res.Contents ?? []) if (o.Key) keys.push(o.Key);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

export async function deleteKeys(bucket: string, keys: string[]) {
  for (let i = 0; i < keys.length; i += 500) {
    const chunk = keys.slice(i, i + 500);
    await getS3().send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: chunk.map((Key) => ({ Key })) } }));
  }
}

/**
 * Not used by the site (physical goods - no file downloads). Kept so the
 * private master copy can be shared manually with a print shop if needed.
 */
export async function getPresignedOriginalUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const bucket = process.env.S3_ORIGINALS_BUCKET;
  if (!bucket) throw new Error("S3_ORIGINALS_BUCKET is not set");
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(getS3(), command, { expiresIn: expiresInSeconds });
}
