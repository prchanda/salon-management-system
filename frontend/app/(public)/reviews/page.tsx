import Link from "next/link";
import { api } from "@/lib/api";
import { SALON } from "@/lib/salon";
import type { Review } from "@/lib/types";

export const metadata = {
  title: "Guest Reviews",
  description: "Honest words from the people who've sat in our chairs.",
  alternates: { canonical: "/reviews" },
};

// Reviews are slow-moving; let the CDN serve a cached HTML page and
// regenerate at most every 10 min.
export const revalidate = 600;

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

          <div className="flex flex-wrap gap-3">
            <Link href="/reviews/new" className="btn-primary whitespace-nowrap">
              Write a review
            </Link>
            <Link
              href={SALON.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline whitespace-nowrap"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 48 48"
                className="-ml-1 mr-2 h-4 w-4"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              Review us on Google
            </Link>
          </div>
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
