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

// Notification ids are "<kind>-<number>" (e.g. "booking-54"). Reject anything
// else so junk can't be persisted into the dismissed list.
const VALID_ID = /^[a-z]+-\d+$/i;

/**
 * Dismiss a single notification, persisted server-side so it disappears on
 * every device the user is signed in on. The viewer id comes from the TRUSTED
 * signed cookie; the client only supplies the event id.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const role = await verifyValue(cookies().get(RECEPTION_COOKIE)?.value);
  if (role !== "owner" && role !== "staff") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const staffId = await verifyValue(cookies().get(STAFF_ID_COOKIE)?.value);
  if (!staffId) {
    return NextResponse.json({ lastSeenAt: null, dismissedIds: [] });
  }

  let id: string | null = null;
  try {
    const body = await req.json();
    if (typeof body?.id === "string" && VALID_ID.test(body.id)) id = body.id;
  } catch {
    /* invalid body — handled below */
  }
  if (!id) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const apiKey = process.env.BACKEND_API_KEY;
  try {
    const backendRes = await fetch(`${API_BASE_URL}/notifications/dismiss`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { "X-Api-Key": apiKey } : {}),
      },
      cache: "no-store",
      body: JSON.stringify({ viewerId: Number(staffId), id }),
    });
    const body = await backendRes.arrayBuffer();
    const headers = new Headers();
    const contentType = backendRes.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    return new NextResponse(body, { status: backendRes.status, headers });
  } catch {
    return NextResponse.json({ lastSeenAt: null, dismissedIds: [id] });
  }
}
