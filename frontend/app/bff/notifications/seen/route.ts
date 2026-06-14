import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyValue } from "@/lib/session-cookie";

// Mutates per-viewer state with the backend secret: always server-side.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:7071/api";

const RECEPTION_COOKIE = "reception_auth";
const STAFF_ID_COOKIE = "reception_staff_id";

/**
 * Mark the reception bell as seen up to a moment, persisted server-side so the
 * unread baseline syncs across every device the user is signed in on.
 *
 * The viewer id is taken from the TRUSTED signed cookie here — the client only
 * supplies the timestamp.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const role = await verifyValue(cookies().get(RECEPTION_COOKIE)?.value);
  if (role !== "owner" && role !== "staff") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const staffId = await verifyValue(cookies().get(STAFF_ID_COOKIE)?.value);
  if (!staffId) {
    // No attributable viewer — accept the call as a no-op.
    return NextResponse.json({ lastSeenAt: null, dismissedIds: [] });
  }

  let lastSeenAt: string | null = null;
  try {
    const body = await req.json();
    if (typeof body?.lastSeenAt === "string") lastSeenAt = body.lastSeenAt;
  } catch {
    /* empty/invalid body — fall back to server "now" on the backend */
  }

  const apiKey = process.env.BACKEND_API_KEY;
  try {
    const backendRes = await fetch(`${API_BASE_URL}/notifications/seen`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { "X-Api-Key": apiKey } : {}),
      },
      cache: "no-store",
      body: JSON.stringify({ viewerId: Number(staffId), lastSeenAt }),
    });
    const body = await backendRes.arrayBuffer();
    const headers = new Headers();
    const contentType = backendRes.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    return new NextResponse(body, { status: backendRes.status, headers });
  } catch {
    return NextResponse.json({ lastSeenAt, dismissedIds: [] });
  }
}
