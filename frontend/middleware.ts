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
    // The cookie can go stale or become orphaned, which previously caused an
    // infinite /reception <-> /reception/change-password loop:
    //   * stale: the password was already changed via the email reset flow,
    //     which never clears this cookie; or
    //   * orphaned: the signed staff-id cookie can't be resolved (e.g. the
    //     signing secret rotated) while the unsigned must-change cookie
    //     survives -> the change-password page bounces back to /reception
    //     because it can't identify the user.
    // Make the middleware authoritative: only pin to the change-password
    // page when we can confirm the change is genuinely still pending.
    const verdict = await mustChangeVerdict(req);
    if (verdict === "required") {
      const url = req.nextUrl.clone();
      url.pathname = CHANGE_PASSWORD_PATH;
      url.search = "";
      return NextResponse.redirect(url);
    }
    // "not-required" (backend says done) or "unknown" (no resolvable id, so
    // the cookie is orphaned and the change-password page can't proceed
    // anyway): self-heal by clearing the cookie and letting the request go.
    const res = NextResponse.next();
    res.cookies.delete({ name: MUST_CHANGE_COOKIE, path: "/" });
    return res;
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
 * Authoritative verdict on whether the signed-in staff member still has a
 * pending forced password change:
 *   - "required"     -> the backend confirms a change is still pending.
 *   - "not-required" -> the backend says the password has been set.
 *   - "unknown"      -> we can't resolve the staff id (orphaned cookie). The
 *                       change-password page can't proceed without an id, so
 *                       pinning there would loop; treat as clearable.
 * If we have a valid id but the backend is unreachable we fail SAFE and keep
 * the gate closed ("required"): the change-password page fails open to the
 * form in that case, so there is no loop.
 */
async function mustChangeVerdict(
  req: NextRequest
): Promise<"required" | "not-required" | "unknown"> {
  const staffIdRaw = await verifyValue(
    req.cookies.get(STAFF_ID_COOKIE)?.value
  );
  const staffId = staffIdRaw ? Number(staffIdRaw) : NaN;
  if (!Number.isFinite(staffId) || staffId <= 0) return "unknown";

  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:7071/api";
  try {
    const res = await fetch(`${base}/staff/${staffId}/session-status`, {
      cache: "no-store",
    });
    if (!res.ok) return "required"; // fail safe while we have a valid id
    const body = (await res.json()) as { mustChangePassword?: boolean };
    return body.mustChangePassword === true ? "required" : "not-required";
  } catch {
    return "required"; // backend unreachable: keep the gate closed
  }
}

export const config = {
  matcher: ["/reception/:path*"],
};
