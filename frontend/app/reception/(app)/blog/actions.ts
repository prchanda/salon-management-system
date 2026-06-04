"use server";

import { revalidatePath } from "next/cache";

/**
 * Invalidate the cached public blog pages so newly published or
 * updated posts appear immediately instead of waiting for the
 * 60-second ISR window. Called from the reception PostEditor.
 */
export async function revalidateBlog(slug?: string | null) {
  revalidatePath("/blog");
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}
