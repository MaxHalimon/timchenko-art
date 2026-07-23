/**
 * Seeds the `products` table from prisma/paintings.json.
 *
 * DEV-ONLY SHORTCUT: this points previewImageKey at a local file under
 * /public/paintings/<file>, served directly by Next.js — NOT the private
 * S3 + watermark pipeline described in the README. That's fine for getting
 * the catalog working locally right now. Before launch, replace this with
 * real S3 keys (see README → "Наступні кроки" → lib/s3.ts + watermarking).
 *
 * originalImageKey is set to the same local path as a placeholder — there
 * is no real "private original" yet. Update it once the S3 pipeline exists.
 *
 * Usage:
 *   1. Fill in prisma/paintings.json with your real paintings.
 *   2. Drop the matching image files in /public/paintings/
 *      (filename must match "previewImageFile" in the JSON).
 *   3. Run: npx prisma db seed
 */

import { PrismaClient, ProductStatus } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

interface PaintingInput {
  slug: string;
  title: string;
  description: string;
  widthCm: number;
  heightCm: number;
  priceUsd: number;
  theme?: string;
  status: "AVAILABLE" | "IN_PROGRESS" | "SOLD";
  previewImageFile: string; // filename only, must exist in /public/paintings/
}

const DATA_PATH = path.join(__dirname, "paintings.json");
const IMAGES_DIR = path.join(__dirname, "..", "public", "paintings");

async function main() {
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`Не знайдено ${DATA_PATH}. Заповніть prisma/paintings.json своїми картинами.`);
  }

  const paintings: PaintingInput[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

  if (paintings.length === 0) {
    console.warn("prisma/paintings.json порожній — нічого сідити.");
    return;
  }

  let missingImages = 0;

  for (const painting of paintings) {
    const imagePath = path.join(IMAGES_DIR, painting.previewImageFile);
    if (!fs.existsSync(imagePath)) {
      console.warn(`⚠️  Файл не знайдено: public/paintings/${painting.previewImageFile} (картина "${painting.title}")`);
      missingImages++;
    }

    await prisma.product.upsert({
      where: { slug: painting.slug },
      update: {
        title: painting.title,
        description: painting.description,
        widthCm: painting.widthCm,
        heightCm: painting.heightCm,
        priceUsd: painting.priceUsd,
        theme: painting.theme,
        status: painting.status as ProductStatus,
        previewImageKey: `/paintings/${painting.previewImageFile}`,
        originalImageKey: `/paintings/${painting.previewImageFile}`, // placeholder — see file header
      },
      create: {
        slug: painting.slug,
        title: painting.title,
        description: painting.description,
        widthCm: painting.widthCm,
        heightCm: painting.heightCm,
        priceUsd: painting.priceUsd,
        theme: painting.theme,
        status: painting.status as ProductStatus,
        previewImageKey: `/paintings/${painting.previewImageFile}`,
        originalImageKey: `/paintings/${painting.previewImageFile}`, // placeholder — see file header
      },
    });

    console.log(`✓ ${painting.title} (${painting.slug})`);
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
