/**
 * Seeds the `products` table from prisma/paintings.json.
 *
 * Image storage has two modes, switched automatically by whether
 * S3_PREVIEWS_PUBLIC_URL is set in .env:
 *
 *  - S3_PREVIEWS_PUBLIC_URL set → previewImageKey points at the file's
 *    public R2 URL (`${S3_PREVIEWS_PUBLIC_URL}/<file>`). Run
 *    scripts/upload-paintings-to-r2.ts first so the files actually exist
 *    there; local files in /public/paintings are no longer needed once
 *    you've confirmed the gallery loads correctly from R2.
 *  - S3_PREVIEWS_PUBLIC_URL unset → dev-only fallback: points at the
 *    local file under /public/paintings/<file>, served directly by
 *    Next.js. Fine for a quick local check, not for production.
 *
 * originalImageKey is still set to the same value as a placeholder —
 * there's no real "private original + presigned download" consumer flow
 * yet (lib/s3.ts has the pieces — getPresignedOriginalUrl — but nothing
 * calls it). Wire that up once the "download your purchased original"
 * flow is built.
 *
 * Usage:
 *   1. Fill in prisma/paintings.json with your real paintings.
 *   2. Either drop image files in /public/paintings/ (dev fallback) or
 *      run scripts/upload-paintings-to-r2.ts and set S3_PREVIEWS_PUBLIC_URL
 *      (filename must match "previewImageFile" in the JSON either way).
 *   3. Run: npx prisma db seed
 */

import { PrismaClient, ProductStatus } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

interface PaintingInput {
  slug: string;
  title: Record<string, string>; // e.g. { uk: "...", en: "...", de: "...", fr: "...", ja: "..." }
  description: Record<string, string>; // same shape as title
  widthCm: number;
  heightCm: number;
  priceEur: number;
  theme?: string;
  /** Stable slug into productCard.materials.* — see messages/*.json. */
  material: string;
  status: "AVAILABLE" | "IN_PROGRESS" | "SOLD";
  previewImageFile: string; // filename only, must exist in /public/paintings/ (or in the R2 bucket, once uploaded)
}

const DATA_PATH = path.join(__dirname, "paintings.json");
const IMAGES_DIR = path.join(__dirname, "..", "public", "paintings");
const R2_PUBLIC_URL = process.env.S3_PREVIEWS_PUBLIC_URL?.replace(/\/$/, ""); // strip trailing slash if present

function imageUrl(filename: string): string {
  return R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${filename}` : `/paintings/${filename}`;
}

/** For console logs only — picks any one name to display, preferring Ukrainian. */
function displayTitle(title: Record<string, string>): string {
  return title.uk ?? title.en ?? Object.values(title)[0] ?? "(без назви)";
}

async function main() {
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`Не знайдено ${DATA_PATH}. Заповніть prisma/paintings.json своїми картинами.`);
  }

  const paintings: PaintingInput[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

  if (paintings.length === 0) {
    console.warn("prisma/paintings.json порожній — нічого сідити.");
    return;
  }

  console.log(
    R2_PUBLIC_URL
      ? `Джерело фото: R2 (${R2_PUBLIC_URL})\n`
      : `Джерело фото: локальна папка public/paintings (R2 не налаштовано — S3_PREVIEWS_PUBLIC_URL порожній)\n`,
  );

  let missingImages = 0;

  for (const painting of paintings) {
    if (R2_PUBLIC_URL) continue; // can't check R2 existence without a network call — trust the upload script's own output instead
    const imagePath = path.join(IMAGES_DIR, painting.previewImageFile);
    if (!fs.existsSync(imagePath)) {
      console.warn(
        `⚠️  Файл не знайдено: public/paintings/${painting.previewImageFile} (картина "${displayTitle(painting.title)}")`,
      );
      missingImages++;
    }

    await prisma.product.upsert({
      where: { slug: painting.slug },
      update: {
        title: painting.title,
        description: painting.description,
        widthCm: painting.widthCm,
        heightCm: painting.heightCm,
        priceEur: painting.priceEur,
        theme: painting.theme,
        material: painting.material,
        status: painting.status as ProductStatus,
        previewImageKey: imageUrl(painting.previewImageFile),
        originalImageKey: imageUrl(painting.previewImageFile), // placeholder — see file header (no private-original pipeline yet)
      },
      create: {
        slug: painting.slug,
        title: painting.title,
        description: painting.description,
        widthCm: painting.widthCm,
        heightCm: painting.heightCm,
        priceEur: painting.priceEur,
        theme: painting.theme,
        material: painting.material,
        status: painting.status as ProductStatus,
        previewImageKey: imageUrl(painting.previewImageFile),
        originalImageKey: imageUrl(painting.previewImageFile), // placeholder — see file header (no private-original pipeline yet)
      },
    });

    console.log(`✓ ${displayTitle(painting.title)} (${painting.slug})`);
  }

  console.log(`\nГотово: ${paintings.length} картин(и) у базі.`);
  if (missingImages > 0) {
    console.warn(`⚠️  ${missingImages} зображень не знайдено в public/paintings/ — картки покажуть biту картинку, доки файл не додасте.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
