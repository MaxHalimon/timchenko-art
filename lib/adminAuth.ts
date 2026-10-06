import { NextRequest, NextResponse } from "next/server";

/**
 * Shared guard for the temporary token-protected admin routes (see
 * app/api/admin/**). Returns a ready-made error response when the request must
 * be rejected, or null when it is allowed through:
 *
 *   const denied = requireAdmin(req);
 *   if (denied) return denied;
 *
 * ADMIN_API_SECRET unset = the whole admin API is switched off (501), it never
 * silently accepts requests. Replace with real login when the admin UI exists.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Admin API not configured (ADMIN_API_SECRET unset)" }, { status: 501 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
