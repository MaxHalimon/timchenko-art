process.loadEnvFile();

import { readdirSync, readFileSync } from "fs";
import { join, extname } from "path";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function main() {
  const { uploadObject } = await import("../lib/s3");

  const bucket = process.env.S3_PREVIEWS_BUCKET;
  if (!bucket) {
    console.error("S3_PREVIEWS_BUCKET is not set in .env — aborting.");
    process.exit(1);
  }

  const dir = join(process.cwd(), "public", "paintings");
  const files = readdirSync(dir).filter((f) => CONTENT_TYPES[extname(f).toLowerCase()]);

  console.log(`Uploading ${files.length} files from public/paintings to bucket "${bucket}"...\n`);

  let uploaded = 0;
  for (const file of files) {
    const contentType = CONTENT_TYPES[extname(file).toLowerCase()];
    const body = readFileSync(join(dir, file));
    await uploadObject(bucket, file, body, contentType);
    uploaded++;
    console.log(`✓ ${file}`);
  }

  console.log(`\nDone: ${uploaded} file(s) uploaded.`);
  if (process.env.S3_PREVIEWS_PUBLIC_URL) {
    console.log(`Public URLs look like: ${process.env.S3_PREVIEWS_PUBLIC_URL}/${files[0]}`);
  }
}

main().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});