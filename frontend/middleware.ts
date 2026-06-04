import { NextRequest, NextResponse } from "next/server";

const COOKIE = "reception_auth";

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

  const role = req.cookies.get(COOKIE)?.value;
  const authed = role === "owner" || role === "staff" || role === "ok";

  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/reception/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Staff are confined to a subset of pages.
  if (role === "staff" && !isStaffAllowed(pathname)) {
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
