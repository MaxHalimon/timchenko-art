import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { localizedText } from "@/lib/localizedText";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const slugs = Array.isArray(body.slugs) ? body.slugs.filter((s: unknown) => typeof s === "string") : [];
  const locale: Locale = locales.includes(body.locale as Locale) ? (body.locale as Locale) : defaultLocale;

  if (slugs.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      slug: p.slug,
      title: localizedText(p.title, locale),
      previewImageUrl: p.previewImageKey,
      widthCm: p.widthCm,
      heightCm: p.heightCm,
      priceUsd: Number(p.priceUsd),
      status: p.status,
    })),
  });
}
