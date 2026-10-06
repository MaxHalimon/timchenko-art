/**
 * Старий скрипт заливав у ПУБЛІЧНИЙ бакет сирі оригінали (повний розмір) просто в корінь: dinner.jpg, adam-and-eve.jpg ... Вони й
 * зараз доступні всім за прямим посиланням. Цей скрипт знаходить їх
 * (файли-зображення БЕЗ "/" у ключі) і видаляє.
 *
 * За замовчуванням — тільки показує список (dry-run). Видалення: --yes
 * Запускайте ПІСЛЯ media:upload + seed + перевірки, що сайт працює на нових ключах.
 */
try {
  process.loadEnvFile();
} catch {}

import { listKeys, deleteKeys } from "../lib/s3";

async function main() {
  const bucket = process.env.S3_PREVIEWS_BUCKET;
  if (!bucket) throw new Error("S3_PREVIEWS_BUCKET не заданий");
  const legacy = (await listKeys(bucket)).filter((k) => !k.includes("/") && /\.(jpe?g|png|webp|tiff?)$/i.test(k));

  if (legacy.length === 0) return console.log("Старих кореневих файлів немає.");
  console.log(`Знайдено ${legacy.length} старих файлів у публічному бакеті "${bucket}":`);
  legacy.forEach((k) => console.log("  -", k));

  if (!process.argv.includes("--yes")) return console.log("\nDry-run. Щоб видалити: npm run media:cleanup -- --yes");
  await deleteKeys(bucket, legacy);
  console.log(`\nВидалено: ${legacy.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
