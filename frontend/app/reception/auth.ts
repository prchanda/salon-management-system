"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  RECEPTION_COOKIE,
  RECEPTION_USER_COOKIE,
  RECEPTION_STAFF_ID_COOKIE,
  RECEPTION_MUST_CHANGE_COOKIE,
  canStaffAccess,
} from "./roles";
import { signValue, verifyValue } from "@/lib/session-cookie";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:7071/api";

const COOKIE_DEFAULTS = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 12, // 12 hours
};

type StaffLoginResult =
  | {
      kind: "ok";
      fullName: string;
      staffId: number;
      mustChangePassword: boolean;
      isOwner: boolean;
    }
  | { kind: "credentials" }
  | { kind: "pending" }
  | { kind: "server" };

async function callStaffLogin(
  username: string,
  password: string
): Promise<StaffLoginResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/staff/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });
    if (res.status === 401) return { kind: "credentials" };
    if (res.status === 403) return { kind: "pending" };
    if (!res.ok) return { kind: "server" };
    const body = (await res.json()) as {
      id: number;
      fullName: string;
      mustChangePassword?: boolean;
      isOwner?: boolean;
    };
    return {
      kind: "ok",
      fullName: body.fullName,
      staffId: body.id,
      mustChangePassword: body.mustChangePassword === true,
      isOwner: body.isOwner === true,
    };
  } catch {
    return { kind: "server" };
  }
}

type RegisterResult =
  | { kind: "ok" }
  | { kind: "bad"; message: string }
  | { kind: "server" };

async function callStaffRegister(payload: object): Promise<RegisterResult> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/staff/registration/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );
    if (res.ok) return { kind: "ok" };
    const data = (await res.json().catch(() => null)) as
      | { message?: string }
      | null;
    return { kind: "bad", message: data?.message ?? "Registration failed." };
  } catch {
    return { kind: "server" };
  }
}

/**
 * Guards against open-redirect: only allow same-site, absolute-path targets
 * (must start with a single "/" and not "//" or "/\" which browsers treat as
 * a protocol-relative URL to another host).
 */
function sanitizeNext(next: string, fallback = "/reception"): string {
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/**
 * Unified reception login. Every account — including the owner — is a Staff
 * row verified by the backend. The owner is distinguished by the isOwner flag
 * returned from the login endpoint, which grants the elevated "owner" session.
 */
export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/reception");

  const failPath = (reason: "credentials" | "server" | "pending") =>
    `/reception/login?error=${reason}&next=${encodeURIComponent(next)}`;

  if (!username || !password) {
    redirect(failPath("credentials"));
  }

  // Fetch + classify before doing anything that redirects.
  const result = await callStaffLogin(username, password);

  if (result.kind === "credentials") {
    redirect(failPath("credentials"));
  }
  if (result.kind === "pending") {
    redirect(failPath("pending"));
  }
  if (result.kind === "server") {
    redirect(failPath("server"));
  }

  cookies().set(
    RECEPTION_COOKIE,
    await signValue(result.isOwner ? "owner" : "staff"),
    COOKIE_DEFAULTS
  );
  cookies().set(RECEPTION_USER_COOKIE, result.fullName, {
    ...COOKIE_DEFAULTS,
    httpOnly: false,
  });
  cookies().set(
    RECEPTION_STAFF_ID_COOKIE,
    await signValue(String(result.staffId)),
    COOKIE_DEFAULTS
  );

  // Accounts seeded/created with a temporary password must set their own
  // password before doing anything (applies to the owner too).
  if (result.mustChangePassword) {
    cookies().set(RECEPTION_MUST_CHANGE_COOKIE, "1", COOKIE_DEFAULTS);
    redirect("/reception/change-password");
  }
  cookies().delete(RECEPTION_MUST_CHANGE_COOKIE);

  // The owner may go anywhere within the site; staff are confined to their
  // allowed routes. Both branches reject off-site redirect targets.
  const ownerNext = sanitizeNext(next);
  if (result.isOwner) {
    redirect(ownerNext);
  }
  const safeNext = canStaffAccess(ownerNext) ? ownerNext : "/reception";
  redirect(safeNext);
}

/** Staff self-service registration — creates a new Staff row. */
export async function staffRegisterAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const roles = formData.getAll("roles").map((r) => String(r).trim()).filter(Boolean);
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const errorPath = (reason: string) =>
    `/reception/register?error=${encodeURIComponent(reason)}`;

  if (fullName.length < 2) redirect(errorPath("Please enter your full name."));
  if (roles.length === 0) redirect(errorPath("Please select at least one role."));
  if (!/^\d{10}$/.test(phone)) {
    redirect(errorPath("Phone number must be exactly 10 digits."));
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(errorPath("Please enter a valid email address."));
  }
  if (password.length < 8) redirect(errorPath("Password must be at least 8 characters."));
  if (password !== confirm) redirect(errorPath("Passwords do not match."));

  const result = await callStaffRegister({
    fullName,
    roles,
    phoneNumber: phone,
    email,
    username,
    password,
  });

  if (result.kind === "bad") {
    redirect(errorPath(result.message));
  }
  if (result.kind === "server") {
    redirect(errorPath("Could not reach the server. Please try again."));
  }

  redirect("/reception/login?registered=pending");
}

export async function logoutAction() {
  cookies().delete(RECEPTION_COOKIE);
  cookies().delete(RECEPTION_USER_COOKIE);
  cookies().delete(RECEPTION_STAFF_ID_COOKIE);
  cookies().delete(RECEPTION_MUST_CHANGE_COOKIE);
  redirect("/reception/login");
}

/**
 * Email-based forgot-password flow. Step 1: user submits their email,
 * backend emails them a link with a one-time token.
 */
export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const errorPath = (reason: string) =>
    `/reception/forgot-password?error=${encodeURIComponent(reason)}`;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(errorPath("Please enter a valid email address."));
  }

  let kind: "ok" | "server" = "ok";
  try {
    const res = await fetch(`${API_BASE_URL}/staff/password-reset/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
    if (!res.ok) kind = "server";
  } catch {
    kind = "server";
  }

  if (kind === "server") {
    redirect(errorPath("Could not reach the server. Please try again."));
  }
  redirect("/reception/forgot-password?sent=1");
}

/** Step 2 of email-based reset: submit the token + new password. */
export async function completePasswordResetAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const errorPath = (reason: string) =>
    `/reception/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(reason)}`;

  if (!token) redirect(errorPath("This reset link is invalid."));
  if (newPassword.length < 8) redirect(errorPath("Password must be at least 8 characters."));
  if (newPassword !== confirm) redirect(errorPath("Passwords do not match."));

  let kind: "ok" | "bad" | "server" = "ok";
  let message = "";
  try {
    const res = await fetch(`${API_BASE_URL}/staff/password-reset/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
      cache: "no-store",
    });
    if (res.ok) {
      kind = "ok";
    } else {
      kind = "bad";
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      message = body?.message ?? "This reset link is invalid or has expired.";
    }
  } catch {
    kind = "server";
  }

  if (kind === "bad") redirect(errorPath(message));
  if (kind === "server") redirect(errorPath("Could not reach the server. Please try again."));

  redirect("/reception/login?reset=1");
}

/**
 * Forced first-login password change for owner-created staff accounts.
 * Verifies the current (temporary) password via the backend, then clears
 * the must-change cookie on success.
 */
export async function changePasswordAction(formData: FormData) {
  const role = await verifyValue(cookies().get(RECEPTION_COOKIE)?.value);
  const staffIdRaw = await verifyValue(
    cookies().get(RECEPTION_STAFF_ID_COOKIE)?.value
  );
  const staffId = staffIdRaw ? Number(staffIdRaw) : NaN;

  if (
    (role !== "staff" && role !== "owner") ||
    !Number.isFinite(staffId) ||
    staffId <= 0
  ) {
    redirect("/reception/login");
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const errorPath = (reason: string) =>
    `/reception/change-password?error=${encodeURIComponent(reason)}`;

  if (currentPassword.length === 0) {
    redirect(errorPath("Enter your temporary password."));
  }
  if (newPassword.length < 8) {
    redirect(errorPath("New password must be at least 8 characters."));
  }
  if (newPassword !== confirm) {
    redirect(errorPath("Passwords do not match."));
  }
  if (newPassword === currentPassword) {
    redirect(errorPath("Choose a password different from the temporary one."));
  }

  let kind: "ok" | "unauthorized" | "bad" | "server" = "ok";
  let message = "";
  try {
    const res = await fetch(`${API_BASE_URL}/staff/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Privileged endpoint: attach the server-only backend API key.
        ...(process.env.BACKEND_API_KEY
          ? { "X-Api-Key": process.env.BACKEND_API_KEY }
          : {}),
      },
      body: JSON.stringify({ staffId, currentPassword, newPassword }),
      cache: "no-store",
    });
    if (res.ok) {
      kind = "ok";
    } else if (res.status === 401) {
      kind = "unauthorized";
    } else {
      kind = "bad";
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      message = body?.message ?? "Could not update your password.";
    }
  } catch {
    kind = "server";
  }

  if (kind === "unauthorized") {
    redirect(errorPath("That temporary password is incorrect."));
  }
  if (kind === "bad") redirect(errorPath(message));
  if (kind === "server") {
    redirect(errorPath("Could not reach the server. Please try again."));
  }

  cookies().delete(RECEPTION_MUST_CHANGE_COOKIE);
  redirect("/reception");
}
