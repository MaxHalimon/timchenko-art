import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const slugs = Array.isArray(body.slugs) ? body.slugs.filter((s: unknown) => typeof s === "string") : [];

  if (slugs.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      slug: p.slug,
      title: p.title,
      previewImageUrl: p.previewImageKey,
      widthCm: p.widthCm,
      heightCm: p.heightCm,
      priceUsd: Number(p.priceUsd),
      status: p.status,
    })),
  });
}
