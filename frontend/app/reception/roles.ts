import { cookies } from "next/headers";
import { verifyValue } from "@/lib/session-cookie";

export const RECEPTION_COOKIE = "reception_auth";
export const RECEPTION_USER_COOKIE = "reception_user";
export const RECEPTION_STAFF_ID_COOKIE = "reception_staff_id";
export const RECEPTION_MUST_CHANGE_COOKIE = "reception_must_change";
// Short-lived marker set the moment a forced password change succeeds. While
// it is present the must-change gates trust that the change is done and skip
// any redirect back to /reception/change-password. This rides out the brief
// read-replica lag where the backend can still report mustChangePassword=true
// right after the write, which otherwise made the layout and the change-
// password page bounce against each other and crash the client router.
export const RECEPTION_PW_SET_COOKIE = "reception_pw_set";
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

/**
 * Read the current reception role from the signed cookie. Returns null if the
 * cookie is missing or its signature does not verify (so a forged/edited
 * cookie is treated as logged-out).
 */
export async function getRole(): Promise<Role | null> {
  const value = await verifyValue(cookies().get(RECEPTION_COOKIE)?.value);
  if (value === "owner" || value === "staff") return value;
  return null;
}

/** Display name of the signed-in user (their full name, or a role fallback). */
export async function getDisplayName(): Promise<string | null> {
  const role = await getRole();
  if (!role) return null;
  return (
    cookies().get(RECEPTION_USER_COOKIE)?.value ??
    (role === "owner" ? "Owner" : "Staff")
  );
}

/**
 * Numeric staff id for the signed-in user, read from the signed cookie. The
 * owner is also a Staff row, so this resolves for owners too (used by the
 * forced password-change flow and to let the owner book herself as a
 * specialist).
 */
export async function getStaffId(): Promise<number | null> {
  const raw = await verifyValue(cookies().get(RECEPTION_STAFF_ID_COOKIE)?.value);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}
