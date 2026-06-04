"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  RECEPTION_COOKIE,
  RECEPTION_USER_COOKIE,
  RECEPTION_STAFF_ID_COOKIE,
  canStaffAccess,
} from "./roles";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:7071/api";

const COOKIE_DEFAULTS = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 12, // 12 hours
};

function ownerCredentials() {
  const username = (process.env.RECEPTION_OWNER_USERNAME ?? "owner")
    .trim()
    .toLowerCase();
  const password =
    process.env.RECEPTION_OWNER_PASSWORD ??
    process.env.RECEPTION_PASSWORD ??
    "***REMOVED***";
  return { username, password };
}

type StaffLoginResult =
  | { kind: "ok"; fullName: string; staffId: number }
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
    const body = (await res.json()) as { id: number; fullName: string };
    return { kind: "ok", fullName: body.fullName, staffId: body.id };
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

type ResetResult =
  | { kind: "ok" }
  | { kind: "notFound" }
  | { kind: "bad"; message: string }
  | { kind: "server" };

async function callResetPassword(
  username: string,
  newPassword: string
): Promise<ResetResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/staff/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, newPassword }),
      cache: "no-store",
    });
    if (res.ok) return { kind: "ok" };
    if (res.status === 404) return { kind: "notFound" };
    const data = (await res.json().catch(() => null)) as
      | { message?: string }
      | null;
    return { kind: "bad", message: data?.message ?? "Reset failed." };
  } catch {
    return { kind: "server" };
  }
}

/**
 * Unified reception login. Detects role from the username:
 *   • Reserved owner username (default "owner")  → owner login
 *   • Any other username                         → staff login (via backend)
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

  const owner = ownerCredentials();

  // Owner login path
  if (username === owner.username) {
    if (password !== owner.password) {
      redirect(failPath("credentials"));
    }
    cookies().set(RECEPTION_COOKIE, "owner", COOKIE_DEFAULTS);
    cookies().delete(RECEPTION_USER_COOKIE);
    cookies().delete(RECEPTION_STAFF_ID_COOKIE);
    redirect(next || "/reception");
  }

  // Staff login path — fetch + classify before doing anything that redirects.
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

  cookies().set(RECEPTION_COOKIE, "staff", COOKIE_DEFAULTS);
  cookies().set(RECEPTION_USER_COOKIE, result.fullName, {
    ...COOKIE_DEFAULTS,
    httpOnly: false,
  });
  cookies().set(RECEPTION_STAFF_ID_COOKIE, String(result.staffId), COOKIE_DEFAULTS);

  const safeNext = canStaffAccess(next) ? next : "/reception";
  redirect(safeNext);
}

/** Staff self-service registration — creates a new Staff row. */
export async function staffRegisterAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
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
  if (role.length < 2) redirect(errorPath("Please enter your role."));
  if (!/^\d{10}$/.test(phone)) {
    redirect(errorPath("Phone number must be exactly 10 digits."));
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(errorPath("Please enter a valid email address."));
  }
  if (password.length < 8) redirect(errorPath("Password must be at least 8 characters."));
  if (password !== confirm) redirect(errorPath("Passwords do not match."));
  if (username === ownerCredentials().username) {
    redirect(errorPath("That username is reserved. Please choose another."));
  }

  const result = await callStaffRegister({
    fullName,
    role,
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
