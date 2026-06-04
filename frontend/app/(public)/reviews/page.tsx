import Link from "next/link";
import { api } from "@/lib/api";
import type { Review } from "@/lib/types";

export const metadata = {
  title: "Guest Reviews · Mr. & Mrs. Cuts Salon",
  description: "Honest words from the people who've sat in our chairs.",
};

export const dynamic = "force-dynamic";

async function safeGetReviews(): Promise<Review[]> {
  try {
    return await api.getReviews(200);
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

function Stars({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, value));
  return (
    <p
      className="text-gold-600"
      aria-label={`${filled} out of 5 stars`}
    >
      {"★".repeat(filled)}
      <span className="text-ink-900/15">{"★".repeat(5 - filled)}</span>
    </p>
  );
}

export default async function ReviewsPage() {
  const reviews = await safeGetReviews();

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <section className="section">
      <div className="container-page">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow">Guest Reviews</span>
            <h1 className="display mt-4">
              In our guests&apos;{" "}
              <span className="italic text-gold-600">own words.</span>
            </h1>
            {reviews.length > 0 ? (
              <p className="lead mt-5 max-w-xl">
                <span className="font-semibold text-ink-900">
                  {average.toFixed(1)}
                </span>{" "}
                average across{" "}
                <span className="font-semibold text-ink-900">
                  {reviews.length}
                </span>{" "}
                {reviews.length === 1 ? "review" : "reviews"}.
              </p>
            ) : (
              <p className="lead mt-5 max-w-xl">
                Be the first to share your experience.
              </p>
            )}
          </div>

          <Link href="/reviews/new" className="btn-primary whitespace-nowrap">
            Write a review
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div className="mt-16 rounded-2xl bg-cream-100 p-12 text-center">
            <p className="text-ink-500">No reviews yet.</p>
          </div>
        ) : (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <article
                key={r.id}
                className="flex h-full flex-col rounded-2xl border border-ink-900/10 bg-cream-50 p-6 shadow-soft"
              >
                <Stars value={r.rating} />
                <blockquote className="mt-4 flex-1 font-serif text-lg leading-snug text-ink-900">
                  “{r.quote}”
                </blockquote>
                <footer className="mt-6 border-t border-ink-900/5 pt-4 text-[11px] uppercase tracking-widest text-ink-500">
                  <p className="font-semibold text-ink-700">
                    {r.authorName}
                    {r.guestSince ? `, guest since ${r.guestSince}` : ""}
                  </p>
                  <p className="mt-1 text-ink-400">{formatDate(r.createdAt)}</p>
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
