/**
 * Готує й вантажить ВСІ медіа сайту в Cloudflare R2:
 *
 *  • картини:  оригінал → ПРИВАТНИЙ бакет (S3_ORIGINALS_BUCKET, майстер-копія)
 *              large.webp (≤2000px) + thumb.webp (≤900px)
 *              → ПУБЛІЧНИЙ бакет (S3_PREVIEWS_BUCKET)
 *  • відео:    hero-loop.mp4 → публічний бакет
 *
 * Ключі містять хеш вмісту (large-ab12cd34.webp) — файл можна кешувати
 * "назавжди" (immutable), а після заміни картини ключ змінюється сам і
 * браузери/CDN одразу беруть нову версію.
 *
 * Результат записується у lib/media-manifest.json (комітьте його), звідки
 * його читає prisma/seed.ts і сайт (відео).
 *
 * Де шукати вихідні файли (перший, що існує):
 *   media-src/paintings  →  public/paintings     (відео: media-src/hero-loop.mp4 → public/videos/hero-loop.mp4)
 *
 * Запуск:  npm run media:upload            (пропускає вже завантажене)
 *          npm run media:upload -- --force (перезаливає все)
 */

try {
  process.loadEnvFile();
} catch {}

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { deleteKeys, objectExists, uploadObject } from "../lib/s3";

const ROOT = path.join(__dirname, "..");
const FORCE = process.argv.includes("--force");
const IMMUTABLE = "public, max-age=31536000, immutable";

// ── Налаштування якості для публічних прев'ю ─────────────────────────────────
const LARGE = { maxSide: 2000, quality: 85 }; // достатньо для деталей на екрані, замало для друку
const THUMB = { maxSide: 900, quality: 80 };

const previewsBucket = process.env.S3_PREVIEWS_BUCKET;
const originalsBucket = process.env.S3_ORIGINALS_BUCKET;
if (!previewsBucket || !originalsBucket) {
  console.error("✗ Не задано S3_PREVIEWS_BUCKET і/або S3_ORIGINALS_BUCKET у .env");
  process.exit(1);
}
if (!process.env.S3_ACCOUNT_ID || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
  console.error("✗ Не задано S3_ACCOUNT_ID / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY у .env");
  process.exit(1);
}


/** Читабельний опис помилки S3/R2: ім'я + HTTP-статус (SDK часто дає лише "UnknownError"). */
function describe(err: unknown): string {
  const e = err as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
  const status = e?.$metadata?.httpStatusCode;
  return `${e?.name ?? "Error"}${status ? ` (HTTP ${status})` : ""}${e?.message && e.message !== e.name ? `: ${e.message}` : ""}`;
}

/** Перед масовим завантаженням перевіряє запис в КОЖЕН бакет окремо — одразу видно, у якому проблема. */
async function preflight(): Promise<boolean> {
  let ok = true;
  for (const [label, bucket] of [["публічний", previewsBucket!], ["приватний", originalsBucket!]] as const) {
    try {
      await uploadObject(bucket, "_probe.txt", Buffer.from("ok"), "text/plain");
      console.log(`✓ запис у ${label} бакет "${bucket}" працює`);
      await deleteKeys(bucket, ["_probe.txt"]).catch(() => {});
    } catch (err) {
      ok = false;
      console.error(`✗ запис у ${label} бакет "${bucket}" НЕ працює: ${describe(err)}`);
    }
  }
  return ok;
}

const firstExisting = (...candidates: string[]) => candidates.map((c) => path.join(ROOT, c)).find((c) => fs.existsSync(c));
const hash8 = (buf: Buffer) => crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);

async function variant(src: Buffer, spec: { maxSide: number; quality: number }): Promise<Buffer> {
  return sharp(src)
    .rotate() // застосувати EXIF-орієнтацію; решту метаданих (EXIF/GPS) sharp за замовчуванням прибирає
    .resize({ width: spec.maxSide, height: spec.maxSide, fit: "inside", withoutEnlargement: true })
    .webp({ quality: spec.quality })
    .toBuffer();
}

async function put(bucket: string, key: string, body: Buffer, type: string, cache?: string) {
  if (!FORCE && (await objectExists(bucket, key))) return "уже є";
  await uploadObject(bucket, key, body, type, cache);
  return "завантажено";
}

const CONTENT_TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".tif": "image/tiff", ".tiff": "image/tiff" };

async function main() {
  const manifestPath = path.join(ROOT, "lib", "media-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as {
    video: string | null;
    paintings: Record<string, { large: string; thumb: string; original: string }>;
  };
  const paintings: { slug: string; previewImageFile: string }[] = JSON.parse(
    fs.readFileSync(path.join(ROOT, "prisma", "paintings.json"), "utf-8"),
  );

  const srcDir = firstExisting("media-src/paintings", "public/paintings");
  if (!srcDir) throw new Error("Не знайдено папку з оригіналами: media-src/paintings або public/paintings");
  console.log(`Оригінали: ${path.relative(ROOT, srcDir)}\nБакет (публічний): ${previewsBucket}\nБакет (приватний): ${originalsBucket}\n`);

  if (!(await preflight())) {
    console.error("\nЗупинено: виправте доступ до бакета(ів) (Cloudflare → R2 → Manage API Tokens: права Object Read & Write на ОБИДВА бакети) і запустіть знову.");
    process.exit(1);
  }
  console.log("");

  let failed = 0;
  for (const p of paintings) {
    const file = path.join(srcDir, p.previewImageFile);
    if (!fs.existsSync(file)) {
      console.warn(`✗ ${p.slug}: немає файлу ${p.previewImageFile}`);
      failed++;
      continue;
    }
    try {
      const src = fs.readFileSync(file);
      const ext = path.extname(p.previewImageFile).toLowerCase();
      const [large, thumb] = await Promise.all([variant(src, LARGE), variant(src, THUMB)]);
      const keys = {
        large: `paintings/${p.slug}/large-${hash8(large)}.webp`,
        thumb: `paintings/${p.slug}/thumb-${hash8(thumb)}.webp`,
        original: `paintings/${p.slug}/original-${hash8(src)}${ext}`,
      };
      const r = [
        await put(previewsBucket!, keys.large, large, "image/webp", IMMUTABLE),
        await put(previewsBucket!, keys.thumb, thumb, "image/webp", IMMUTABLE),
        await put(originalsBucket!, keys.original, src, CONTENT_TYPES[ext] ?? "application/octet-stream"),
      ];
      manifest.paintings[p.slug] = keys;
      console.log(
        `✓ ${p.slug.padEnd(40)} large ${(large.length / 1024).toFixed(0)} КБ · thumb ${(thumb.length / 1024).toFixed(0)} КБ  [${r.join(", ")}]`,
      );
    } catch (err) {
      failed++;
      console.error(`✗ ${p.slug}: ${describe(err)}`);
    }
  }

  // Відео
  const videoFile = firstExisting("media-src/hero-loop.mp4", "public/videos/hero-loop.mp4");
  if (videoFile) {
    const buf = fs.readFileSync(videoFile);
    const key = `videos/hero-loop-${hash8(buf)}.mp4`;
    console.log(`✓ відео ${key} (${(buf.length / 1e6).toFixed(1)} МБ) [${await put(previewsBucket!, key, buf, "video/mp4", IMMUTABLE)}]`);
    manifest.video = key;
  } else {
    console.warn("• hero-loop.mp4 не знайдено (media-src/ або public/videos/) — відео пропущено");
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nManifest оновлено: lib/media-manifest.json (${Object.keys(manifest.paintings).length} картин).`);
  if (failed > 0) {
    console.error(`⚠ Помилок: ${failed}. Виправте й запустіть ще раз (готове не перезавантажується).`);
    process.exit(1);
  }
  console.log("Далі: npx prisma db seed  →  npm run media:verify");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
