import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

/**
 * Marks a painting exclusive (or takes the mark off).
 *
 *   POST /api/admin/products/<slug>/exclusive   {"exclusive": true}
 *   Authorization: Bearer <ADMIN_API_SECRET>
 *
 * Exclusive = never repainted and never printed. Use it when a painting that is
 * still in stock is bought on the agreement that it leaves the shop for good:
 * set it BEFORE the sale (it can then be bought once, nothing else), or right
 * after (the sold painting then stops being offered as a repaint or a print).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { slug } = await params;
  const body = (await req.json().catch(() => null)) as { exclusive?: unknown } | null;
  if (typeof body?.exclusive !== "boolean") {
    return NextResponse.json({ error: 'Send {"exclusive": true} or {"exclusive": false}' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Painting not found" }, { status: 404 });

  await prisma.product.update({ where: { id: product.id }, data: { exclusive: body.exclusive } });
  return NextResponse.json({ ok: true, slug, exclusive: body.exclusive });
}
