import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import type { Post } from "@/lib/types";

export const revalidate = 60;

interface Props {
  params: { slug: string };
}

async function safeGetPost(slug: string): Promise<Post | null> {
  try {
    return await api.getPostBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const post = await safeGetPost(params.slug);
  if (!post) return { title: "Not found · Mr. & Mrs. Cuts Salon" };
  return {
    title: `${post.title} · Mr. & Mrs. Cuts Salon`,
    description: post.excerpt,
  };
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

export default async function BlogPostPage({ params }: Props) {
  const post = await safeGetPost(params.slug);
  if (!post) notFound();

  const html = renderMarkdown(post.body);
  const tags = (post.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <article className="section">
      <div className="container-page max-w-5xl">
        <Link
          href="/blog"
          className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 hover:text-ink-900"
        >
          ← Journal
        </Link>

        <header className="mt-8 max-w-3xl">
          {tags.length > 0 && (
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-600">
              {tags.join(" · ")}
            </p>
          )}
          <h1 className="display mt-4">{post.title}</h1>
          <p className="lead mt-5">{post.excerpt}</p>
          <p className="mt-6 text-[11px] uppercase tracking-widest text-ink-400">
            {formatDate(post.publishedAt ?? post.createdAt)}
          </p>
        </header>

        {post.coverImageUrl && (
          <div className="mt-10 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImageUrl}
              alt=""
              loading="eager"
              decoding="async"
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        <div
          className="prose-blog mt-10 max-w-3xl font-sans text-base"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </article>
  );
}
