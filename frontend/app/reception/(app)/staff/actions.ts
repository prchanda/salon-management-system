"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getRole } from "@/app/reception/roles";

function assertOwner() {
  if (getRole() !== "owner") {
    redirect("/reception/login");
  }
}

export async function createStaffAction(formData: FormData) {
  assertOwner();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const roles = formData.getAll("roles").map((r) => String(r).trim()).filter(Boolean);
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const errorPath = (reason: string) =>
    `/reception/staff?formError=${encodeURIComponent(reason)}`;

  if (fullName.length < 2) redirect(errorPath("Please enter the staff member's full name."));
  if (roles.length === 0) redirect(errorPath("Please select at least one role."));
  if (!/^\d{10}$/.test(phone)) {
    redirect(errorPath("Phone number must be exactly 10 digits."));
  }
  if (email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(errorPath("Please enter a valid email address, or leave it blank."));
  }
  if (username.length < 3 || username.length > 32) {
    redirect(errorPath("Username must be 3 to 32 characters."));
  }
  if (!/^[a-z0-9._-]+$/.test(username)) {
    redirect(errorPath("Username may contain only lowercase letters, numbers, dot, dash, underscore."));
  }
  if (password.length < 8) {
    redirect(errorPath("Password must be at least 8 characters."));
  }

  let outcome: { ok: true } | { ok: false; message: string };
  try {
    await api.createStaffAccount({
      fullName,
      roles,
      phoneNumber: phone,
      email: email.length > 0 ? email : undefined,
      username,
      password,
    });
    outcome = { ok: true };
  } catch (e) {
    outcome = { ok: false, message: extractApiMessage(e) };
  }

  if (!outcome.ok) {
    redirect(errorPath(outcome.message));
  }

  revalidatePath("/reception/staff");
  redirect("/reception/staff?created=1");
}

export async function updateStaffAction(formData: FormData) {
  assertOwner();

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    redirect("/reception/staff?error=update");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const roles = formData.getAll("roles").map((r) => String(r).trim()).filter(Boolean);
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const errorPath = (reason: string) =>
    `/reception/staff?editId=${id}&editError=${encodeURIComponent(reason)}`;

  if (fullName.length < 2) redirect(errorPath("Please enter the staff member's full name."));
  if (roles.length === 0) redirect(errorPath("Please select at least one role."));
  if (!/^\d{10}$/.test(phone)) {
    redirect(errorPath("Phone number must be exactly 10 digits."));
  }
  if (email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(errorPath("Please enter a valid email address, or leave it blank."));
  }

  let outcome: { ok: true } | { ok: false; message: string };
  try {
    await api.updateStaffAccount(id, {
      fullName,
      roles,
      phoneNumber: phone,
      email: email.length > 0 ? email : undefined,
    });
    outcome = { ok: true };
  } catch (e) {
    outcome = { ok: false, message: extractApiMessage(e) };
  }

  if (!outcome.ok) {
    redirect(errorPath(outcome.message));
  }

  revalidatePath("/reception/staff");
  redirect(`/reception/staff?updated=${id}`);
}

/** Pulls the backend's `{ "message": "…" }` text out of an api request error. */
function extractApiMessage(error: unknown): string {
  const fallback = "Could not create the account. Please try again.";
  if (!(error instanceof Error)) return fallback;
  const dashIndex = error.message.indexOf(" - ");
  if (dashIndex === -1) return fallback;
  const body = error.message.slice(dashIndex + 3).trim();
  try {
    const parsed = JSON.parse(body) as { message?: string };
    return parsed.message?.trim() || fallback;
  } catch {
    return fallback;
  }
}

export async function approveStaffAction(formData: FormData) {
  assertOwner();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) return;
  try {
    await api.approveStaffAccount(id);
  } catch {
    // surface via URL flag
    redirect("/reception/staff?error=approve");
  }
  revalidatePath("/reception/staff");
}

export async function rejectStaffAction(formData: FormData) {
  assertOwner();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) return;
  try {
    await api.rejectStaffAccount(id);
  } catch {
    redirect("/reception/staff?error=reject");
  }
  revalidatePath("/reception/staff");
}
