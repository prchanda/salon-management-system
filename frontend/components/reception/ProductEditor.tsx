"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";
import { uploadProductImage } from "@/lib/uploads";
import { revalidateShop } from "@/app/reception/(app)/products/actions";

interface Props {
  initial?: Product;
}

const CATEGORY_PRESETS = [
  "Hair",
  "Skin",
  "Beard",
  "Body",
  "Nails",
  "Fragrance",
  "Tools & Accessories",
] as const;
const OTHER_CATEGORY = "__other__";

export function ProductEditor({ initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const initialCategory = initial?.category ?? "";
  const initialIsPreset =
    !!initialCategory &&
    (CATEGORY_PRESETS as readonly string[]).includes(initialCategory);
  const [categoryChoice, setCategoryChoice] = useState<string>(
    !initialCategory ? "" : initialIsPreset ? initialCategory : OTHER_CATEGORY
  );
  const [customCategory, setCustomCategory] = useState<string>(
    !initialCategory || initialIsPreset ? "" : initialCategory
  );
  const [shortDescription, setShortDescription] = useState(
    initial?.shortDescription ?? ""
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState<string>(
    initial?.price != null ? String(initial.price) : ""
  );
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [trackStock, setTrackStock] = useState(
    initial?.stockQuantity != null
  );
  const [stockQuantity, setStockQuantity] = useState<string>(
    initial?.stockQuantity != null ? String(initial.stockQuantity) : ""
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "save" | "delete" | null
  >(null);
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
      const url = await uploadProductImage(file);
      setImageUrl(url);
      try {
        const head = await fetch(url, { method: "HEAD" });
        const sizeHeader = head.headers.get("content-length");
        const finalKb = sizeHeader
          ? Math.round(Number(sizeHeader) / 1024)
          : null;
        if (finalKb) {
          const pct = Math.max(
            0,
            Math.round((1 - finalKb / originalKb) * 100)
          );
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

  async function save() {
    setError(null);

    const n = name.trim();
    const d = description.trim();
    const priceNum = Number(price);

    if (!n) return setError("Name is required.");
    if (!Number.isFinite(priceNum) || priceNum < 0)
      return setError("Price must be a non-negative number.");

    const resolvedCategory =
      categoryChoice === OTHER_CATEGORY
        ? customCategory.trim()
        : categoryChoice.trim();
    let stockNum: number | null | undefined;
    if (trackStock) {
      const s = Number(stockQuantity);
      if (!Number.isFinite(s) || s < 0 || !Number.isInteger(s))
        return setError("Stock quantity must be a non-negative whole number.");
      stockNum = s;
    } else {
      stockNum = null;
    }

    setPendingAction("save");
    setSaving(true);
    try {
      if (isEdit && initial) {
        const updated = await api.updateProduct(initial.id, {
          name: n,
          category: resolvedCategory || null,
          shortDescription: shortDescription.trim() || null,
          description: d,
          price: priceNum,
          imageUrl: imageUrl.trim() || null,
          stockQuantity: trackStock ? stockNum ?? 0 : undefined,
          clearStock: !trackStock,
          isActive,
        });
        await revalidateShop(updated.slug);
      } else {
        const created = await api.createProduct({
          name: n,
          category: resolvedCategory || null,
          shortDescription: shortDescription.trim() || null,
          description: d,
          price: priceNum,
          imageUrl: imageUrl.trim() || null,
          stockQuantity: trackStock ? stockNum ?? 0 : null,
          isActive,
        });
        await revalidateShop(created.slug);
      }
      // Refresh the destination cache first, then navigate. Keep the spinner
      // up through the transition — resetting here would flip the button back
      // to idle while the list page is still loading (1-2s of dead UI).
      router.refresh();
      router.replace("/reception/products");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the product."
      );
      setSaving(false);
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    if (!isEdit || !initial) return;
    if (
      !confirm(
        "Delete this product permanently? Past orders will keep their snapshot."
      )
    )
      return;
    setPendingAction("delete");
    setSaving(true);
    try {
      await api.deleteProduct(initial.id);
      await revalidateShop(initial.slug);
      router.refresh();
      router.replace("/reception/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setSaving(false);
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-6">
      {saving && (
        <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-gold-600/20">
          <div className="h-full w-1/3 animate-[loader_1.2s_ease-in-out_infinite] bg-gold-600" />
          <style>{`@keyframes loader { 0% { transform: translateX(-100%);} 100% { transform: translateX(400%);} }`}</style>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-cream-50 p-6 shadow-soft">
        <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700">
          Product name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Argan oil hair serum"
          className="mt-2 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-3 font-serif text-2xl text-ink-900 focus:border-gold-600 focus:outline-none"
          maxLength={160}
        />

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700">
              Category
            </label>
            <select
              value={categoryChoice}
              onChange={(e) => setCategoryChoice(e.target.value)}
              className="mt-2 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
            >
              <option value="">— Uncategorised —</option>
              {CATEGORY_PRESETS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={OTHER_CATEGORY}>Other…</option>
            </select>
            {categoryChoice === OTHER_CATEGORY && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Custom category"
                maxLength={60}
                className="mt-2 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700">
              Price (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="499"
              className="mt-2 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700">
            Short description{" "}
            <span className="font-normal lowercase text-ink-400">
              (shown on catalogue card)
            </span>
          </label>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            rows={2}
            maxLength={240}
            placeholder="A weightless, fast-absorbing serum…"
            className="mt-2 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm text-ink-700 focus:border-gold-600 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-ink-400">
            {shortDescription.length} / 240
          </p>
        </div>

        <div className="mt-6">
          <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700">
            Product image
          </label>
          <div className="mt-2 flex items-start gap-4">
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
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-ink-900/10 bg-cream-100/50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={trackStock}
                onChange={(e) => setTrackStock(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-900/20 text-gold-600 focus:ring-gold-600"
              />
              <span className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-700">
                  Track inventory
                </span>
                <span className="mt-1 text-[11px] leading-snug text-ink-400">
                  Show stock count and prevent ordering once it hits zero.
                </span>
              </span>
            </label>
            {trackStock && (
              <input
                type="number"
                min="0"
                step="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="0"
                aria-label="Stock quantity"
                className="mt-3 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
              />
            )}
          </div>

          <div className="rounded-xl border border-ink-900/10 bg-cream-100/50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-900/20 text-gold-600 focus:ring-gold-600"
              />
              <span className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-700">
                  Visible on shop page
                </span>
                <span className="mt-1 text-[11px] leading-snug text-ink-400">
                  Untick to hide from customers without deleting the listing.
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-cream-50 p-6 shadow-soft">
        <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700">
          Full description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={10}
          maxLength={6000}
          placeholder="Ingredients, benefits, how to use, etc."
          className="mt-2 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm leading-relaxed text-ink-700 focus:border-gold-600 focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-ink-400">
          {description.length} / 6000
        </p>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-900/10 bg-cream-50/95 px-5 py-4 shadow-soft backdrop-blur">
        <div className="text-xs uppercase tracking-widest text-ink-500">
          {isEdit ? (
            isActive ? (
              <span className="text-green-700">Live</span>
            ) : (
              <span className="text-ink-500">Hidden</span>
            )
          ) : (
            "New product"
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/reception/products" className="btn-ghost">
            Cancel
          </Link>
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-cream-50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "delete" && <Spinner />}
              {pendingAction === "delete" ? "Deleting…" : "Delete"}
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-primary inline-flex items-center gap-2"
          >
            {pendingAction === "save" && <Spinner light />}
            {pendingAction === "save"
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
              ? "Save changes"
              : "Create product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 animate-spin ${light ? "text-cream-50" : "text-current"}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
