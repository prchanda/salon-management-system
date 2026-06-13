import { NextRequest, NextResponse } from "next/server";
import { verifyValue } from "@/lib/session-cookie";

const COOKIE = "reception_auth";
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

export const config = {
  matcher: ["/reception/:path*"],
};
