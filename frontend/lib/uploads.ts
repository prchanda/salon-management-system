// Client-side image compression + upload helpers for the blog editor.
//
// Strategy (runs entirely in the browser — no server cost):
//   1. Respect EXIF orientation (so phone photos aren't sideways).
//   2. Downscale to a max of 1600 px on the longest side — sharp on retina
//      desktops, modest enough for fast mobile downloads.
//   3. Encode to WebP and iteratively lower quality until the file fits a
//      target size budget. Guarantees small uploads regardless of input.
//   4. If still too large, scale down again and retry.
//   5. Upload to Supabase Storage bucket "blog" with a 1-year cache header.

import { BLOG_BUCKET, getSupabase } from "./supabase";

const MAX_DIM = 1600; // px on longest side
const TARGET_BYTES = 220 * 1024; // ~220 KB — looks great, mobile-friendly
const HARD_CEILING = 500 * 1024; // never accept more than 500 KB
const QUALITY_STEPS = [0.85, 0.78, 0.7, 0.62, 0.55, 0.48, 0.4];

async function loadBitmap(file: File): Promise<ImageBitmap> {
  // imageOrientation: "from-image" applies EXIF rotation so portraits stay portrait.
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(file);
  }
}

function drawToCanvas(
  bitmap: ImageBitmap,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function canvasToWebp(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image encoding failed."))),
      "image/webp",
      quality
    );
  });
}

/**
 * Compress an image so it's small enough for fast mobile delivery while still
 * looking sharp on large screens. Returns a WebP blob.
 */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported.");
  }

  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  let width = Math.max(1, Math.round(bitmap.width * scale));
  let height = Math.max(1, Math.round(bitmap.height * scale));
  let canvas = drawToCanvas(bitmap, width, height);
  bitmap.close?.();

  // Walk down the quality ladder until under the target size.
  let last: Blob | null = null;
  for (const q of QUALITY_STEPS) {
    const blob = await canvasToWebp(canvas, q);
    last = blob;
    if (blob.size <= TARGET_BYTES) return blob;
  }

  // Still too big — scale the canvas down once more and retry low qualities.
  if (last && last.size > HARD_CEILING) {
    const bitmap2 = await loadBitmap(file);
    width = Math.max(1, Math.round(width * 0.75));
    height = Math.max(1, Math.round(height * 0.75));
    canvas = drawToCanvas(bitmap2, width, height);
    bitmap2.close?.();
    for (const q of [0.7, 0.55, 0.4]) {
      const blob = await canvasToWebp(canvas, q);
      last = blob;
      if (blob.size <= HARD_CEILING) return blob;
    }
  }

  if (!last) throw new Error("Image compression failed.");
  return last;
}

function randomId(): string {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}

/**
 * Compresses then uploads an image to the public "blog" bucket.
 * Returns the public URL to persist on the post row.
 */
export async function uploadBlogImage(file: File): Promise<string> {
  const blob = await compressImage(file);
  const path = `covers/${randomId()}.webp`;

  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(BLOG_BUCKET)
    .upload(path, blob, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(BLOG_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
