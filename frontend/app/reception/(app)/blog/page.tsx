import Link from "next/link";
import { api } from "@/lib/api";
import { markdownToPlainText } from "@/lib/markdown";
import type { AdminPostSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

async function safeList(): Promise<AdminPostSummary[]> {
  try {
    return await api.getAdminPosts();
  } catch {
    return [];
  }
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default async function ReceptionBlogPage() {
  const posts = await safeList();

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink-900">Journal</h1>
          <p className="mt-1 text-sm text-ink-500">
            Write notes for guests — treatments, tips, seasonal advice.
          </p>
        </div>
        <Link href="/reception/blog/new" className="btn-primary whitespace-nowrap">
          New post
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink-900/10 bg-cream-50">
        {posts.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-500">
            No posts yet. Click <span className="font-semibold">New post</span> to write the first one.
          </div>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="divide-y divide-ink-900/5 md:hidden">
              {posts.map((p) => (
                <li key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/reception/blog/${p.id}/edit`}
                      className="min-w-0 font-serif text-base text-ink-900 hover:text-gold-600"
                    >
                      <span className="break-words">{p.title}</span>
                    </Link>
                    {p.isPublished ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
                        Draft
                      </span>
                    )}
                  </div>
                  {p.excerpt && (
                    <p className="mt-1 line-clamp-2 text-xs text-ink-500">
                      {markdownToPlainText(p.excerpt)}
                    </p>
                  )}
                  {p.tags && (
                    <p className="mt-2 line-clamp-1 text-xs text-ink-400">
                      {p.tags}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs text-ink-500">
                    <span>{formatDate(p.updatedAt)}</span>
                    <span className="ml-auto flex items-center gap-3">
                      {p.isPublished && (
                        <Link
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 hover:text-ink-900"
                        >
                          View
                        </Link>
                      )}
                      <Link
                        href={`/reception/blog/${p.id}/edit`}
                        className="text-[11px] font-semibold uppercase tracking-widest text-gold-600 hover:text-ink-900"
                      >
                        Edit
                      </Link>
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <table className="hidden w-full table-fixed text-sm md:table">
              <colgroup>
                <col className="w-[42%]" />
                <col className="w-[14%]" />
                <col className="w-[24%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead className="bg-cream-100 text-[11px] uppercase tracking-widest text-ink-500">
                <tr>
                  <th className="px-5 py-3 text-left">Title</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Tags</th>
                  <th className="px-5 py-3 text-left">Updated</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-t border-ink-900/5 align-top">
                    <td className="px-5 py-4">
                      <Link
                        href={`/reception/blog/${p.id}/edit`}
                        className="font-serif text-base text-ink-900 hover:text-gold-600"
                      >
                        {p.title}
                      </Link>
                      {p.excerpt && (
                        <p className="mt-1 line-clamp-1 text-xs text-ink-500">
                          {markdownToPlainText(p.excerpt)}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {p.isPublished ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-ink-500">
                      <span className="line-clamp-2 break-words">
                        {p.tags || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-ink-500">
                      {formatDate(p.updatedAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        {p.isPublished && (
                          <Link
                            href={`/blog/${p.slug}`}
                            target="_blank"
                            className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 hover:text-ink-900"
                          >
                            View
                          </Link>
                        )}
                        <Link
                          href={`/reception/blog/${p.id}/edit`}
                          className="text-[11px] font-semibold uppercase tracking-widest text-gold-600 hover:text-ink-900"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
