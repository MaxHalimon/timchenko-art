/**
 * Наповнює таблицю products з prisma/paintings.json.
 *
 * Картини в БД зберігаються ЛИШЕ як відносні ключі об'єктів у R2
 * (lib/media-manifest.json), який пише `npm run media:upload`.
 * Сам сид нічого не завантажує й нічого не читає з диска, окрім JSON —
 * тому він не залежить від того, чи лежать файли в public/paintings.
 *
 * Порядок:
 *   1. npx prisma migrate deploy
 *   2. npm run media:upload          (генерує WebP + водяний знак, вантажить в R2, пише manifest)
 *   3. npx prisma db seed            (цей файл)
 *
 * (Раніше тут стояло `if (R2_PUBLIC_URL) continue;` ПЕРЕД upsert — коли R2
 * був налаштований, сид мовчки пропускав усі картини й БД лишалась зі
 * старими шляхами /paintings/... — саме через це картини «зникали».)
 */

try {
  process.loadEnvFile(); // Node ≥ 20.12; якщо .env немає або Prisma вже його завантажив — ігноруємо
} catch {}

import { PrismaClient, ProductStatus } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

interface PaintingInput {
  slug: string;
  title: Record<string, string>;
  description: Record<string, string>;
  widthCm: number;
  heightCm: number;
  priceEur: number;
  theme?: string;
  /** Stable slug into productCard.materials.* — see messages/*.json. */
  material: string;
  status: "AVAILABLE" | "IN_PROGRESS" | "SOLD";
  /** Ім'я вихідного файлу (для `media:upload`); сам сид його не читає. */
  previewImageFile: string;
}

interface Manifest {
  video: string | null;
  paintings: Record<string, { large: string; thumb: string; original: string }>;
}

const DATA_PATH = path.join(__dirname, "paintings.json");
const MANIFEST_PATH = path.join(__dirname, "..", "lib", "media-manifest.json");

function displayTitle(title: Record<string, string>): string {
  return title.uk ?? title.en ?? Object.values(title)[0] ?? "(без назви)";
}

async function main() {
  if (!fs.existsSync(DATA_PATH)) throw new Error(`Не знайдено ${DATA_PATH}.`);
  if (!fs.existsSync(MANIFEST_PATH)) throw new Error(`Не знайдено ${MANIFEST_PATH}. Спершу виконайте: npm run media:upload`);

  const paintings: PaintingInput[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));

  // Fail fast, ДО будь-яких записів у БД: краще зупинитись, ніж записати картини без зображень.
  const missing = paintings.filter((p) => !manifest.paintings[p.slug]).map((p) => p.slug);
  if (missing.length > 0) {
    throw new Error(
      `У lib/media-manifest.json немає зображень для: ${missing.join(", ")}.\n` +
        `Виконайте: npm run media:upload (і закомітьте оновлений manifest).`,
    );
  }

  for (const painting of paintings) {
    const m = manifest.paintings[painting.slug];
    const data = {
      title: painting.title,
      description: painting.description,
      widthCm: painting.widthCm,
      heightCm: painting.heightCm,
      priceEur: painting.priceEur,
      theme: painting.theme,
      material: painting.material,
      status: painting.status as ProductStatus,
      previewImageKey: m.large,
      thumbImageKey: m.thumb,
      originalImageKey: m.original,
    };

    await prisma.product.upsert({
      where: { slug: painting.slug },
      update: data,
      create: { slug: painting.slug, ...data },
    });

    console.log(`✓ ${displayTitle(painting.title)} (${painting.slug})`);
  }

  console.log(`\nГотово: ${paintings.length} картин(и) у базі.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
