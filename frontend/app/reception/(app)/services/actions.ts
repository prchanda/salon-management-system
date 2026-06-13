"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getRole } from "@/app/reception/roles";
import {
  SERVICE_CATEGORY_VALUES,
  DEFAULT_SERVICE_CATEGORY,
} from "@/lib/serviceCategories";

async function assertOwner() {
  if ((await getRole()) !== "owner") {
    redirect("/reception/login");
  }
}

function normalizeCategory(raw: string): string {
  const match = SERVICE_CATEGORY_VALUES.find(
    (c) => c.toLowerCase() === raw.trim().toLowerCase()
  );
  return match ?? DEFAULT_SERVICE_CATEGORY;
}

export async function createServiceAction(formData: FormData) {
  await assertOwner();

  const serviceName = String(formData.get("serviceName") ?? "").trim();
  const category = normalizeCategory(String(formData.get("category") ?? ""));
  const description = String(formData.get("description") ?? "").trim();
  const durationRaw = String(formData.get("durationMinutes") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const isActive = formData.get("isActive") != null;

  const errorPath = (reason: string) =>
    `/reception/services/new?formError=${encodeURIComponent(reason)}`;

  if (serviceName.length < 2 || serviceName.length > 160) {
    redirect(errorPath("Please enter a service name (2–160 characters)."));
  }
  if (description.length > 2000) {
    redirect(errorPath("Description must be 2000 characters or fewer."));
  }

  const durationMinutes = Number(durationRaw);
  if (
    !Number.isFinite(durationMinutes) ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    durationMinutes > 24 * 60
  ) {
    redirect(errorPath("Duration must be a whole number of minutes (1–1440)."));
  }

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    redirect(errorPath("Price must be a non-negative number."));
  }

  // redirect() throws NEXT_REDIRECT, so it must run outside the try/catch.
  let failed = false;
  try {
    await api.createService({
      serviceName,
      category,
      description: description || null,
      durationMinutes,
      price,
      isActive,
    });
  } catch {
    failed = true;
  }

  if (failed) {
    redirect(errorPath("Could not create the service. Please try again."));
  }

  // Bust the cached public pages so the new service appears for customers.
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath("/reception/services");

  redirect("/reception/services?created=1");
}

export async function updateServiceAction(formData: FormData) {
  await assertOwner();

  const idRaw = String(formData.get("id") ?? "").trim();
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    redirect("/reception/services");
  }

  const durationRaw = String(formData.get("durationMinutes") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const category = normalizeCategory(String(formData.get("category") ?? ""));
  const isActive = formData.get("isActive") != null;

  const errorPath = (reason: string) =>
    `/reception/services/${id}/edit?formError=${encodeURIComponent(reason)}`;

  const durationMinutes = Number(durationRaw);
  if (
    !Number.isFinite(durationMinutes) ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    durationMinutes > 24 * 60
  ) {
    redirect(errorPath("Duration must be a whole number of minutes (1–1440)."));
  }

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    redirect(errorPath("Price must be a non-negative number."));
  }

  // redirect() throws NEXT_REDIRECT, so it must run outside the try/catch.
  let failed = false;
  try {
    await api.updateService(id, {
      category,
      durationMinutes,
      price,
      isActive,
    });
  } catch {
    failed = true;
  }

  if (failed) {
    redirect(errorPath("Could not update the service. Please try again."));
  }

  // Bust the cached public pages so the changes appear for customers.
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath("/reception/services");

  redirect("/reception/services?updated=1");
}
