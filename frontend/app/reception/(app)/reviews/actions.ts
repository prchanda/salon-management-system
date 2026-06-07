"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getRole } from "@/app/reception/roles";

async function assertOwner() {
  if ((await getRole()) !== "owner") {
    redirect("/reception/login");
  }
}

/** Invalidate the public pages that render approved reviews. */
function revalidatePublicReviews() {
  revalidatePath("/reviews");
  revalidatePath("/");
}

export async function approveReviewAction(formData: FormData) {
  await assertOwner();

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    redirect("/reception/reviews?error=approve");
  }

  try {
    await api.approveReview(id);
  } catch {
    redirect("/reception/reviews?error=approve");
  }

  revalidatePath("/reception/reviews");
  revalidatePublicReviews();
  redirect(`/reception/reviews?approved=${id}`);
}

export async function deleteReviewAction(formData: FormData) {
  await assertOwner();

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    redirect("/reception/reviews?error=delete");
  }

  try {
    await api.deleteReview(id);
  } catch {
    redirect("/reception/reviews?error=delete");
  }

  revalidatePath("/reception/reviews");
  revalidatePublicReviews();
  redirect(`/reception/reviews?deleted=${id}`);
}
