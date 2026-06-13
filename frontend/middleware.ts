import { NextRequest, NextResponse } from "next/server";
import { verifyValue } from "@/lib/session-cookie";

const COOKIE = "reception_auth";
const STAFF_ID_COOKIE = "reception_staff_id";
const MUST_CHANGE_COOKIE = "reception_must_change";
const CHANGE_PASSWORD_PATH = "/reception/change-password";

const STAFF_ALLOWED_PREFIXES = [
  "/reception",
  "/reception/new",
  "/reception/customers",
  "/reception/dormant",
];

function isStaffAllowed(pathname: string): boolean {
  // Exact match on the bookings list home, plus prefix match for the others.
  if (pathname === "/reception") return true;
  return STAFF_ALLOWED_PREFIXES.some(
    (p) => p !== "/reception" && (pathname === p || pathname.startsWith(`${p}/`))
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/reception")) {
    return NextResponse.next();
  }

  if (
    pathname === "/reception/login" ||
    pathname === "/reception/register" ||
    pathname === "/reception/forgot-password" ||
    pathname === "/reception/reset-password"
  ) {
    return NextResponse.next();
  }

  return guard(req, pathname);
}

async function guard(req: NextRequest, pathname: string) {
  const role = await verifyValue(req.cookies.get(COOKIE)?.value);
  const authed = role === "owner" || role === "staff";

  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/reception/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Forced first-login password change: pin the staff member to the
  // change-password page until they clear the flag. This is a fast-path
  // based on the cookie; the reception layout and the change-password page
  // also verify against the backend, so a deleted cookie cannot bypass it.
  const mustChange = req.cookies.get(MUST_CHANGE_COOKIE)?.value === "1";
  if (mustChange && pathname !== CHANGE_PASSWORD_PATH) {
    // The cookie can go stale (e.g. the password was changed via the email
    // reset flow, which never touches this cookie). Without a backend check
    // we'd bounce forever: here -> change-password page -> (backend says no
    // change needed) -> back to /reception -> here again. Verify against the
    // backend and self-heal by clearing the stale cookie if it's no longer
    // needed; only redirect when the change is genuinely still pending (or
    // the backend is unreachable, in which case we keep the gate closed).
    const stillRequired = await backendRequiresChange(req);
    if (stillRequired === false) {
      const res = NextResponse.next();
      res.cookies.delete({ name: MUST_CHANGE_COOKIE, path: "/" });
      return res;
    }
    const url = req.nextUrl.clone();
    url.pathname = CHANGE_PASSWORD_PATH;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Staff are confined to a subset of pages (the change-password page is
  // always reachable so the forced-change flow can complete).
  if (
    role === "staff" &&
    pathname !== CHANGE_PASSWORD_PATH &&
    !isStaffAllowed(pathname)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/reception";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Authoritative check against the backend for whether the signed-in staff
 * member still has a pending forced password change. Returns:
 *   - true  -> change is still required (keep the gate closed)
 *   - false -> no change needed (the cookie is stale and can be cleared)
 *   - null  -> unknown (missing/invalid id or backend unreachable); callers
 *              should fail safe and keep the gate closed.
 */
async function backendRequiresChange(
  req: NextRequest
): Promise<boolean | null> {
  const staffIdRaw = await verifyValue(
    req.cookies.get(STAFF_ID_COOKIE)?.value
  );
  const staffId = staffIdRaw ? Number(staffIdRaw) : NaN;
  if (!Number.isFinite(staffId) || staffId <= 0) return null;

  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:7071/api";
  try {
    const res = await fetch(`${base}/staff/${staffId}/session-status`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { mustChangePassword?: boolean };
    return body.mustChangePassword === true;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/reception/:path*"],
};
