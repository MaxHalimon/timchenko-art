import { NextRequest, NextResponse } from "next/server";
import { advanceOrderStatus } from "@/lib/orderStatus";
import type { EmailableStatus } from "@/lib/orderEmails";

const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET;
const ADVANCEABLE_STATUSES: EmailableStatus[] = ["PAINTING", "DRYING", "READY_TO_SHIP", "SHIPPED", "DELIVERED"];

/**
 * TEMPORARY stand-in for a real admin UI, which doesn't exist yet (the
 * User model with passwordHash is there, but no login flow is wired up).
 * Until that's built, Marina (or whoever's helping her) can advance an
 * order's status with a single authenticated request, e.g.:
 *
 *   curl -X POST https://<site>/api/admin/orders/<orderId>/status \
 *     -H "Authorization: Bearer <ADMIN_API_SECRET>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"status":"PAINTING"}'
 *
 * For SHIPPED, also pass trackingNumber/trackingCarrier in the body —
 * those get saved on the order and included in the shipped email.
 *
 * Set ADMIN_API_SECRET in .env to enable this route at all (unset =
 * always 501, never silently accepts requests). Whatever replaces this
 * with a real admin UI later should call advanceOrderStatus() from
 * lib/orderStatus.ts directly rather than hitting this route internally.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!ADMIN_API_SECRET) {
    return NextResponse.json({ error: "Admin API not configured (ADMIN_API_SECRET unset)" }, { status: 501 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${ADMIN_API_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status as EmailableStatus | undefined;

  if (!status || !ADVANCEABLE_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${ADVANCEABLE_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  if (status === "SHIPPED" && !body?.trackingNumber) {
    return NextResponse.json({ error: "trackingNumber is required when status is SHIPPED" }, { status: 400 });
  }

  await advanceOrderStatus(orderId, status, {
    trackingNumber: body?.trackingNumber,
    trackingCarrier: body?.trackingCarrier,
  });

  return NextResponse.json({ ok: true });
}
