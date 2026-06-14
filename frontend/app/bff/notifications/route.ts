import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyValue } from "@/lib/session-cookie";

// Carries the backend secret and per-session scoped data: always server-side,
// never cached.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:7071/api";

const RECEPTION_COOKIE = "reception_auth";
const STAFF_ID_COOKIE = "reception_staff_id";

/**
 * Scoped notification feed for the reception bell.
 *
 * This is a DEDICATED handler (it shadows the generic /bff/[...path] proxy for
 * this one path) because notification visibility must be enforced from the
 * TRUSTED signed cookies, not from client-supplied query params:
 *   - owner -> sees everything;
 *   - staff -> only their own new bookings (we forward scope=staff and their
 *     own specialistId, both derived server-side here).
 *
 * The caller may pass `since` (ISO cursor) and `limit`; everything else that
 * determines visibility is set here.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const role = await verifyValue(cookies().get(RECEPTION_COOKIE)?.value);
  if (role !== "owner" && role !== "staff") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const params = new URLSearchParams();
  const since = req.nextUrl.searchParams.get("since");
  if (since) params.set("since", since);
  const limit = req.nextUrl.searchParams.get("limit");
  if (limit) params.set("limit", limit);

  if (role === "staff") {
    const staffId = await verifyValue(cookies().get(STAFF_ID_COOKIE)?.value);
    params.set("scope", "staff");
    // An unresolvable id yields an empty feed on the backend, which is the
    // correct fail-closed behaviour for a staff session.
    if (staffId) params.set("specialistId", staffId);
  }

  const url = `${API_BASE_URL}/notifications?${params.toString()}`;
  const apiKey = process.env.BACKEND_API_KEY;

  try {
    const backendRes = await fetch(url, {
      headers: apiKey ? { "X-Api-Key": apiKey } : {},
      cache: "no-store",
    });
    const body = await backendRes.arrayBuffer();
    const headers = new Headers();
    const contentType = backendRes.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    return new NextResponse(body, { status: backendRes.status, headers });
  } catch {
    // Never surface a hard error to the poller — just an empty feed.
    return NextResponse.json({ serverTime: new Date().toISOString(), events: [] });
  }
}
