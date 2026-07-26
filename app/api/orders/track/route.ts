import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Looks up an order by its own ID (given to the customer at checkout, e.g.
 * in the success-page URL) OR by the courier's tracking number (given once
 * the order ships). Deliberately returns only non-sensitive fields — no
 * customer name, email, or shipping address — since this endpoint has no
 * authentication and is reachable by anyone who has the reference number.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const reference = typeof body.reference === "string" ? body.reference.trim() : "";

  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: reference }, { trackingNumber: reference }],
    },
    include: {
      product: { select: { title: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    status: order.status,
    trackingNumber: order.trackingNumber,
    trackingCarrier: order.trackingCarrier,
    paintingTitle: order.product.title,
  });
}
