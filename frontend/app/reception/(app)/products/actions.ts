"use server";

import { revalidatePath } from "next/cache";

/**
 * Invalidate the cached public shop pages so newly created or updated
 * products appear immediately instead of waiting for the 60-second
 * ISR window. Called from the reception ProductEditor.
 */
export async function revalidateShop(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/shop");
  if (slug) {
    revalidatePath(`/shop/${slug}`);
  }
}
