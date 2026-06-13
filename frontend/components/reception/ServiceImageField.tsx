"use client";

import { useState } from "react";
import { uploadServiceImage } from "@/lib/uploads";

interface Props {
  /** Existing image URL when editing a service. */
  initialUrl?: string | null;
}

/**
 * Image picker for the service create/edit forms. These forms submit via a
 * server action, so this client component keeps the chosen URL in a hidden
 * <input name="imageUrl"> that the action reads. The browser compresses to
 * WebP and uploads through /api/uploads before the form is submitted.
 */
export function ServiceImageField({ initialUrl }: Props) {
  const [imageUrl, setImageUrl] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadInfo(null);
    setUploading(true);
    const originalKb = Math.round(file.size / 1024);
    try {
      const url = await uploadServiceImage(file);
      setImageUrl(url);
      try {
        const head = await fetch(url, { method: "HEAD" });
        const sizeHeader = head.headers.get("content-length");
        const finalKb = sizeHeader
          ? Math.round(Number(sizeHeader) / 1024)
          : null;
        if (finalKb) {
          const pct = Math.max(0, Math.round((1 - finalKb / originalKb) * 100));
          setUploadInfo(
            `Compressed ${originalKb} KB → ${finalKb} KB (${pct}% smaller)`
          );
        } else {
          setUploadInfo(`Original ${originalKb} KB → optimized`);
        }
      } catch {
        setUploadInfo(`Original ${originalKb} KB → optimized`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? `Upload failed: ${err.message}` : "Upload failed."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
        Image (optional)
      </span>

      {/* The server action reads this. */}
      <input type="hidden" name="imageUrl" value={imageUrl} />

      {error && (
        <p className="mb-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-start gap-4">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-24 w-32 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-24 w-32 items-center justify-center rounded-lg bg-cream-100 text-[11px] uppercase tracking-widest text-ink-400">
            No image
          </div>
        )}
        <div className="flex-1 space-y-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… or upload below"
            className="w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold-600 hover:text-ink-900">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? "Optimizing & uploading…" : "Upload image"}
          </label>
          {uploadInfo && !uploading && (
            <p className="text-[11px] text-green-700">{uploadInfo}</p>
          )}
          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="ml-3 text-[11px] uppercase tracking-widest text-ink-400 hover:text-ink-700"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-400">
        A representative photo of the result. Shown on the public services menu.
      </p>
    </div>
  );
}
