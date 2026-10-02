/**
 * Перевіряє, що кожне зображення/відео з БД (або з manifest) реально віддається
 * публічним URL — саме те, що ламалося раніше. Нічого не змінює.
 *
 *   npm run media:verify
 */
try {
  process.loadEnvFile();
} catch {}

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { mediaUrl } from "../lib/media";

const prisma = new PrismaClient();

async function check(label: string, url: string): Promise<boolean> {
  if (!url) {
    console.error(`✗ ${label}: порожній URL (S3_PREVIEWS_PUBLIC_URL не заданий?)`);
    return false;
  }
  try {
    const res = await fetch(url, { method: "HEAD" });
    const type = res.headers.get("content-type") ?? "?";
    const size = Number(res.headers.get("content-length") ?? 0);
    const ok = res.ok && (type.startsWith("image/") || type.startsWith("video/"));
    console.log(`${ok ? "✓" : "✗"} ${label.padEnd(44)} ${res.status} ${type} ${(size / 1024).toFixed(0)} КБ`);
    if (!ok && res.status === 401) console.error("   ↳ 401/403: у бакета не ввімкнено публічний доступ (r2.dev або Custom Domain).");
    return ok;
  } catch (err) {
    console.error(`✗ ${label}: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

async function main() {
  console.log(`Публічна база: ${process.env.S3_PREVIEWS_PUBLIC_URL || "(НЕ ЗАДАНО)"}\n`);
  const products = await prisma.product.findMany({ select: { slug: true, previewImageKey: true, thumbImageKey: true } });
  let bad = 0;
  for (const p of products) {
    if (!(await check(`${p.slug} / large`, mediaUrl(p.previewImageKey)))) bad++;
    if (p.thumbImageKey && !(await check(`${p.slug} / thumb`, mediaUrl(p.thumbImageKey)))) bad++;
    if (!p.thumbImageKey) console.warn(`• ${p.slug}: thumbImageKey порожній (запустіть seed після media:upload)`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "lib", "media-manifest.json"), "utf-8"));
  if (manifest.video && !(await check("відео", mediaUrl(manifest.video)))) bad++;

  console.log(bad === 0 ? `\nУсе гаразд: ${products.length} картин у БД доступні.` : `\n✗ Проблемних файлів: ${bad}`);
  if (bad > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
