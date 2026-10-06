/**
 * One-off catalog correction (2026-10-05), safe to run more than once:
 *   - "Orange"  -> 4000 EUR
 *   - "Disco"   -> 3000 EUR
 *   - "Colorful life": removes the duplicate that costs 150 EUR
 *     (the 1000 EUR one stays)
 *
 * Why a script and not `prisma db seed`: the seed also writes `status` from
 * paintings.json, which would put already-SOLD paintings back on sale.
 * prisma/paintings.json is corrected too, so a future seed agrees with this.
 *
 * Run:  npm run catalog:fix
 */
try {
  process.loadEnvFile();
} catch {}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function titleOf(title: unknown): string {
  const t = title as Record<string, string> | null;
  return (t?.en ?? t?.uk ?? "").trim().toLowerCase();
}

async function main() {
  const products = await prisma.product.findMany();

  for (const [name, price] of [["orange", 4000], ["disco", 3000]] as const) {
    const matches = products.filter((p) => titleOf(p.title) === name);
    if (matches.length === 0) console.log(`! "${name}" not found - nothing changed`);
    for (const p of matches) {
      await prisma.product.update({ where: { id: p.id }, data: { priceEur: price } });
      console.log(`OK ${name} (${p.slug}): ${Number(p.priceEur)} -> ${price} EUR`);
    }
  }

  const colorful = products.filter((p) => titleOf(p.title) === "colorful life");
  console.log(`"Colorful life" in the database: ${colorful.map((p) => `${p.slug} = ${Number(p.priceEur)} EUR`).join("; ") || "none"}`);

  for (const p of colorful.filter((x) => Number(x.priceEur) === 150)) {
    const used = await prisma.orderItem.count({ where: { productId: p.id } });
    if (used > 0) {
      console.log(`! ${p.slug} (150 EUR) appears in ${used} order item(s) - NOT deleted, handle it manually`);
      continue;
    }
    await prisma.product.delete({ where: { id: p.id } });
    console.log(`OK deleted duplicate ${p.slug} (150 EUR)`);
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
