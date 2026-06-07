"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/Spinner";

const QUOTE_MIN = 10;
const QUOTE_MAX = 500;

export function ReviewForm() {
  const [authorName, setAuthorName] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const remaining = QUOTE_MAX - quote.length;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const name = authorName.trim();
    const text = quote.trim();

    if (!name) {
      setError("Please tell us your name.");
      return;
    }
    if (text.length < QUOTE_MIN) {
      setError(`Review must be at least ${QUOTE_MIN} characters.`);
      return;
    }
    if (text.length > QUOTE_MAX) {
      setError(`Review must be ${QUOTE_MAX} characters or fewer.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.submitReview({
        authorName: name,
        quote: text,
        rating,
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-gold-600/30 bg-cream-100 p-8 text-center">
        <p className="text-gold-600" aria-hidden>
          ★ ★ ★ ★ ★
        </p>
        <h2 className="mt-4 font-serif text-2xl text-ink-900">Thank you.</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
          Your review has been received. We read each one before publishing, so
          it may appear on our site shortly.
        </p>
        <Link href="/" className="btn-ghost mt-6 inline-flex">
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <label
          htmlFor="rating"
          className="block text-xs font-semibold uppercase tracking-widest text-ink-700"
        >
          Rating
        </label>
        <div
          id="rating"
          role="radiogroup"
          aria-label="Rating"
          className="mt-3 flex items-center gap-2"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => setRating(n)}
              className={`text-3xl transition ${
                n <= rating
                  ? "text-gold-600"
                  : "text-ink-900/20 hover:text-gold-400"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="authorName"
          className="block text-xs font-semibold uppercase tracking-widest text-ink-700"
        >
          Your name
        </label>
        <input
          id="authorName"
          type="text"
          required
          maxLength={80}
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="e.g. Aanya R."
          className="mt-2 w-full rounded-xl border border-ink-900/15 bg-cream-50 px-4 py-3 text-sm text-ink-900 outline-none ring-gold-600/30 transition focus:border-gold-600 focus:ring-2"
        />
      </div>

      <div>
        <label
          htmlFor="quote"
          className="flex items-baseline justify-between text-xs font-semibold uppercase tracking-widest text-ink-700"
        >
          <span>Your review</span>
          <span className="font-normal text-ink-500">
            {remaining < 0 ? `${-remaining} over` : `${remaining} left`}
          </span>
        </label>
        <textarea
          id="quote"
          required
          minLength={QUOTE_MIN}
          maxLength={QUOTE_MAX}
          rows={5}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="A short note about your visit…"
          className="mt-2 w-full resize-y rounded-xl border border-ink-900/15 bg-cream-50 px-4 py-3 text-sm text-ink-900 outline-none ring-gold-600/30 transition focus:border-gold-600 focus:ring-2"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary inline-flex items-center gap-2 disabled:cursor-progress disabled:opacity-60"
        >
          {submitting && <Spinner light className="h-4 w-4" />}
          {submitting ? "Sending…" : "Send review"}
        </button>
        <Link href="/" className="text-sm text-ink-500 hover:text-ink-900">
          Cancel
        </Link>
      </div>
    </form>
  );
}
