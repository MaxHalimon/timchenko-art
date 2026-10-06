import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { RETURN_WINDOW_DAYS } from "@/lib/constants";

/**
 * Monthly commission report — the paperwork behind the 20% the artist owes
 * the site operator.
 *
 * Money flow: customers pay the artist's own Stripe / crypto accounts, so
 * nothing is split automatically. Once a month the artist pays the operator the
 * commission for the orders that are "due", against an invoice for services.
 * This route lists those orders and totals them up for the invoice.
 *
 *   GET  /api/admin/commission-report?month=2026-10            → JSON (default: this month)
 *   GET  /api/admin/commission-report?month=2026-10&format=csv → CSV for the accountant
 *   POST /api/admin/commission-report  {"month":"2026-10","settleDue":true}
 *        or {"orderIds":["…","…"]}  → mark orders as settled after the money arrived
 *
 * All requests need  Authorization: Bearer <ADMIN_API_SECRET>.
 *
 * Which month an order belongs to: the month it was PAID (UTC).
 * When an order's commission is "due": it is DELIVERED, the 14-day return
 * window (RETURN_WINDOW_DAYS) has passed, and it isn't settled yet — so
 * commission is never invoiced on an order that can still be returned.
 *
 * ⚠️ Refunds are not modelled yet (there is no REFUNDED status): if an order is
 * refunded, simply don't settle it / adjust the invoice by hand.
 */

const DAY_MS = 86_400_000;

function parseMonth(value: string | null) {
  const now = new Date();
  const label = value ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(label);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return { label, start: new Date(Date.UTC(year, month - 1, 1)), end: new Date(Date.UTC(year, month, 1)) };
}

const toCents = (value: unknown) => Math.round(Number(value) * 100);
const fromCents = (cents: number) => cents / 100;

async function loadRows(start: Date, end: Date) {
  const orders = await prisma.order.findMany({
    where: { paidAt: { gte: start, lt: end }, status: { not: "PREVIEW" } },
    include: { payment: { select: { provider: true } } },
    orderBy: { paidAt: "asc" },
  });

  const now = Date.now();
  return orders.map((order) => {
    const returnWindowEndsAt = order.deliveredAt
      ? new Date(order.deliveredAt.getTime() + RETURN_WINDOW_DAYS * DAY_MS)
      : null;
    const due =
      !order.commissionSettled &&
      order.status === "DELIVERED" &&
      returnWindowEndsAt !== null &&
      returnWindowEndsAt.getTime() <= now;
    const address = order.shippingAddress as unknown as { country?: string } | null;

    return {
      orderId: order.id,
      paidAt: order.paidAt,
      provider: order.payment?.provider ?? null,
      status: order.status,
      customerCountry: address?.country ?? null, // useful for the VAT question (see PAYMENTS_GUIDE.md)
      amountEur: Number(order.amountEur),
      commissionEur: Number(order.platformCommissionEur),
      artistKeepsEur: Number(order.artistPayoutEur),
      deliveredAt: order.deliveredAt,
      returnWindowEndsAt,
      settled: order.commissionSettled,
      settledAt: order.commissionSettledAt,
      due,
    };
  });
}

type Row = Awaited<ReturnType<typeof loadRows>>[number];

function summarize(rows: Row[]) {
  const sum = (pick: (row: Row) => boolean, field: "amountEur" | "commissionEur") =>
    fromCents(rows.filter(pick).reduce((total, row) => total + toCents(row[field]), 0));

  return {
    orders: rows.length,
    salesEur: sum(() => true, "amountEur"),
    commissionTotalEur: sum(() => true, "commissionEur"),
    commissionDueNowEur: sum((row) => row.due, "commissionEur"), // → this is what goes on the invoice
    commissionNotYetDueEur: sum((row) => !row.due && !row.settled, "commissionEur"),
    commissionSettledEur: sum((row) => row.settled, "commissionEur"),
  };
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const range = parseMonth(req.nextUrl.searchParams.get("month"));
  if (!range) return NextResponse.json({ error: "month must look like 2026-10" }, { status: 400 });

  const rows = await loadRows(range.start, range.end);

  if (req.nextUrl.searchParams.get("format") === "csv") {
    const columns = Object.keys(
      rows[0] ?? {
        orderId: 0, paidAt: 0, provider: 0, status: 0, customerCountry: 0, amountEur: 0, commissionEur: 0,
        artistKeepsEur: 0, deliveredAt: 0, returnWindowEndsAt: 0, settled: 0, settledAt: 0, due: 0,
      },
    ) as (keyof Row)[];
    // ";" + BOM: what Excel in European locales expects, so the file opens in columns.
    const csv =
      "\uFEFF" +
      [columns.join(";"), ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(";"))].join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="commission-${range.label}.csv"`,
      },
    });
  }

  return NextResponse.json({ month: range.label, returnWindowDays: RETURN_WINDOW_DAYS, summary: summarize(rows), orders: rows });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as {
    month?: string;
    settleDue?: boolean;
    orderIds?: string[];
  } | null;

  const settledNow = { commissionSettled: true, commissionSettledAt: new Date() };

  if (Array.isArray(body?.orderIds) && body.orderIds.length > 0) {
    const result = await prisma.order.updateMany({
      where: { id: { in: body.orderIds }, status: { not: "PREVIEW" }, commissionSettled: false },
      data: settledNow,
    });
    return NextResponse.json({ ok: true, settled: result.count });
  }

  if (body?.settleDue === true) {
    const range = parseMonth(body.month ?? null);
    if (!range) return NextResponse.json({ error: "month must look like 2026-10" }, { status: 400 });
    const dueIds = (await loadRows(range.start, range.end)).filter((row) => row.due).map((row) => row.orderId);
    const result = await prisma.order.updateMany({
      where: { id: { in: dueIds }, commissionSettled: false },
      data: settledNow,
    });
    return NextResponse.json({ ok: true, month: range.label, settled: result.count });
  }

  return NextResponse.json(
    { error: 'Send {"orderIds":[…]} or {"month":"2026-10","settleDue":true}' },
    { status: 400 },
  );
}
