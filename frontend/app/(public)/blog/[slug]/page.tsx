import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { renderExcerptMarkdown, renderMarkdown } from "@/lib/markdown";
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
  if (!post) return { title: "Not found" };
  const canonical = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: canonical,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      images: post.coverImageUrl
        ? [{ url: post.coverImageUrl }]
        : ["/images/og-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverImageUrl
        ? [post.coverImageUrl]
        : ["/images/og-image.jpg"],
    },
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

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImageUrl
      ? [post.coverImageUrl]
      : ["https://www.mrandmrscuts.in/images/og-image.jpg"],
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: "Mr. & Mrs. Cuts Salon" },
    publisher: {
      "@type": "Organization",
      name: "Mr. & Mrs. Cuts Salon",
      logo: {
        "@type": "ImageObject",
        url: "https://www.mrandmrscuts.in/icon.png",
      },
    },
    mainEntityOfPage: `https://www.mrandmrscuts.in/blog/${post.slug}`,
  };

  return (
    <article className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {/*
        Embedded Instagram/Facebook reels are third-party iframes whose biggest
        upfront cost is the DNS lookup + TLS handshake to their origins. Warming
        those connections in parallel with the page shaves that latency off the
        embed's load. (dns-prefetch is the fallback for browsers that ignore
        preconnect.)
      */}
      <link rel="preconnect" href="https://www.instagram.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://scontent.cdninstagram.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://static.cdninstagram.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.facebook.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.instagram.com" />
      <link rel="dns-prefetch" href="https://scontent.cdninstagram.com" />
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
          <div
            className="lead mt-5"
            dangerouslySetInnerHTML={{ __html: renderExcerptMarkdown(post.excerpt) }}
          />
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
