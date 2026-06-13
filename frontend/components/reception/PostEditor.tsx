"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import type { Post } from "@/lib/types";
import { uploadBlogImage } from "@/lib/uploads";
import { revalidateBlog } from "@/app/reception/(app)/blog/actions";

interface Props {
  initial?: Post;
}

export function PostEditor({ initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [tags, setTags] = useState(initial?.tags ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    initial?.coverImageUrl ?? ""
  );
  const [isPublished, setIsPublished] = useState(
    initial?.isPublished ?? false
  );

  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "draft" | "publish" | "delete" | null
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
      const url = await uploadBlogImage(file);
      setCoverImageUrl(url);
      // Read back the final size so the owner can see the savings.
      try {
        const head = await fetch(url, { method: "HEAD" });
        const sizeHeader = head.headers.get("content-length");
        const finalKb = sizeHeader ? Math.round(Number(sizeHeader) / 1024) : null;
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
        err instanceof Error
          ? `Upload failed: ${err.message}`
          : "Upload failed."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function save(publish: boolean) {
    setError(null);

    const t = title.trim();
    const e = excerpt.trim();
    const b = body.trim();

    if (!t) return setError("Title is required.");
    if (b.length < 20) return setError("Body must be at least 20 characters.");

    setPendingAction(publish ? "publish" : "draft");
    setSaving(true);
    try {
      if (isEdit && initial) {
        const updated = await api.updatePost(initial.id, {
          title: t,
          excerpt: e,
          body: b,
          tags: tags.trim() || null,
          coverImageUrl: coverImageUrl.trim() || null,
          isPublished: publish,
        });
        // Bust the public ISR cache so changes appear immediately.
        await revalidateBlog(updated.slug);
        if (publish) {
          router.replace("/reception/blog");
        } else {
          router.replace(`/reception/blog/${initial.id}/edit`);
        }
        router.refresh();
      } else {
        const created = await api.createPost({
          title: t,
          excerpt: e,
          body: b,
          tags: tags.trim() || undefined,
          coverImageUrl: coverImageUrl.trim() || undefined,
          publish,
        });
        await revalidateBlog(created.slug);
        if (publish) {
          router.replace("/reception/blog");
        } else {
          router.replace(`/reception/blog/${created.id}/edit`);
        }
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the post."
      );
    } finally {
      setSaving(false);
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    if (!isEdit || !initial) return;
    if (!confirm("Delete this post permanently? This cannot be undone.")) return;
    setPendingAction("delete");
    setSaving(true);
    try {
      await api.deletePost(initial.id);
      await revalidateBlog(initial.slug);
      router.replace("/reception/blog");
      router.refresh();
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
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Winter skin care — the salon's quiet ritual"
          className="mt-2 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-3 font-serif text-2xl text-ink-900 focus:border-gold-600 focus:outline-none"
          maxLength={160}
        />

        <label className="mt-6 block text-xs font-semibold uppercase tracking-widest text-ink-700">
          Excerpt <span className="font-normal lowercase text-ink-400">(shown on listing)</span>
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          maxLength={400}
          placeholder="A short, inviting summary…"
          className="mt-2 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm text-ink-700 focus:border-gold-600 focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-ink-400">
          {excerpt.length} / 400
        </p>

        <div className="mt-6">
          <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700">
            Tags <span className="font-normal lowercase text-ink-400">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="hair, treatments"
            className="mt-2 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2.5 text-sm focus:border-gold-600 focus:outline-none"
          />
        </div>

        <div className="mt-6">
          <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700">
            Cover image
          </label>
          <div className="mt-2 flex items-start gap-4">
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
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
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
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
              {coverImageUrl && (
                <button
                  type="button"
                  onClick={() => setCoverImageUrl("")}
                  className="ml-3 text-[11px] uppercase tracking-widest text-ink-400 hover:text-ink-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-cream-50 p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-widest text-ink-700">
            Body <span className="font-normal lowercase text-ink-400">(Markdown)</span>
          </label>
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="text-[11px] font-semibold uppercase tracking-widest text-gold-600 hover:text-ink-900"
          >
            {preview ? "Edit" : "Preview"}
          </button>
        </div>

        {preview ? (
          <div
            className="prose-blog mt-4 min-h-[24rem] rounded-lg border border-ink-900/10 bg-cream-50 p-6"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
          />
        ) : (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={20}
            placeholder={`# Heading\n\nWrite your story here. Use **bold**, *italic*, [links](https://), and lists.\n\n- Tip one\n- Tip two`}
            className="mt-4 w-full rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-3 font-mono text-sm leading-relaxed text-ink-800 focus:border-gold-600 focus:outline-none"
          />
        )}

        <p className="mt-2 text-[11px] text-ink-400">
          Supports Markdown: headings (#), **bold**, *italic*, [links](), lists, &gt; quotes, `code`, tables.
        </p>
        <p className="mt-1 text-[11px] text-ink-400">
          Embed a video: paste an Instagram or Facebook video/reel link on its
          own line and it becomes a playable embed.
        </p>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-900/10 bg-cream-50/95 px-5 py-4 shadow-soft backdrop-blur">
        <div className="text-xs uppercase tracking-widest text-ink-500">
          {isEdit ? (
            isPublished ? (
              <span className="text-green-700">Published</span>
            ) : (
              <span className="text-ink-500">Draft</span>
            )
          ) : (
            "New post"
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/reception/blog" className="btn-ghost">
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
            onClick={() => save(false)}
            disabled={saving}
            className="btn-outline inline-flex items-center gap-2"
          >
            {pendingAction === "draft" && <Spinner />}
            {pendingAction === "draft" ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            className="btn-primary inline-flex items-center gap-2"
          >
            {pendingAction === "publish" && <Spinner light />}
            {pendingAction === "publish"
              ? isPublished
                ? "Updating…"
                : "Publishing…"
              : isPublished
              ? "Update"
              : "Publish"}
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
