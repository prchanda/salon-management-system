import Link from "next/link";
import { api } from "@/lib/api";
import { markdownToPlainText } from "@/lib/markdown";
import type { PostSummary } from "@/lib/types";

export const metadata = {
  title: "Journal",
  description:
    "Notes from our chairs — on hair care, skin rituals, and seasonal treatments.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 60;

async function safeGetPosts(): Promise<PostSummary[]> {
  try {
    return await api.getPosts(50);
  } catch {
    return [];
  }
}

function formatDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function tagList(tags?: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default async function BlogIndexPage() {
  const posts = await safeGetPosts();

  return (
    <section className="section">
      <div className="container-page">
        <div className="max-w-3xl">
          <span className="eyebrow">The Journal</span>
          <h1 className="display mt-4 sm:whitespace-nowrap">
            Insights in <span className="italic text-gold-600">hair, skin &amp; care.</span>
          </h1>
          <p className="lead mt-5 max-w-2xl">
            Expert guidance from our senior specialists — treatment deep-dives,
            seasonal care routines, and the techniques behind every chair.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="mt-16 rounded-2xl bg-cream-100 p-12 text-center">
            <p className="text-ink-500">Stories are on their way.</p>
          </div>
        ) : (
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => {
              const tags = tagList(p.tags);
              return (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-900/10 bg-cream-50 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {p.coverImageUrl ? (
                    <div className="relative aspect-[4/3] overflow-hidden bg-cream-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.coverImageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-gradient-to-br from-cream-100 to-cream-200" />
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    {tags.length > 0 && (
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gold-600">
                        {tags[0]}
                      </p>
                    )}
                    <h2 className="font-serif text-xl leading-snug text-ink-900 group-hover:text-gold-600">
                      {p.title}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-600">
                      {markdownToPlainText(p.excerpt)}
                    </p>
                    <p className="mt-6 text-[11px] uppercase tracking-widest text-ink-400">
                      {formatDate(p.publishedAt ?? p.createdAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
