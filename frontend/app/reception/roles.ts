import { cookies } from "next/headers";

export const RECEPTION_COOKIE = "reception_auth";
export const RECEPTION_USER_COOKIE = "reception_user";
export const RECEPTION_STAFF_ID_COOKIE = "reception_staff_id";
export type Role = "owner" | "staff";

const STAFF_PATH_PREFIXES = [
  "/reception/new",
  "/reception/customers",
  "/reception/dormant",
];

/** Routes a staff member is allowed to view (everything else is owner-only). */
export function canStaffAccess(pathname: string): boolean {
  if (pathname === "/reception") return true;
  return STAFF_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/** Read the current reception role from the cookie. */
export function getRole(): Role | null {
  const value = cookies().get(RECEPTION_COOKIE)?.value;
  if (value === "owner" || value === "staff") return value;
  // Back-compat: an older "ok" cookie was used before roles existed —
  // treat it as owner so existing sessions don't break.
  if (value === "ok") return "owner";
  return null;
}

/** Display name of the signed-in user (the staff's full name, or "Owner"). */
export function getDisplayName(): string | null {
  const role = getRole();
  if (!role) return null;
  if (role === "owner") return "Owner";
  return cookies().get(RECEPTION_USER_COOKIE)?.value ?? "Staff";
}

/** Numeric staff id for the signed-in staff member (null for owner). */
export function getStaffId(): number | null {
  if (getRole() !== "staff") return null;
  const raw = cookies().get(RECEPTION_STAFF_ID_COOKIE)?.value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}
