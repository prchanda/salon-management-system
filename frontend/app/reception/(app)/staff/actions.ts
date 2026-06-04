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
