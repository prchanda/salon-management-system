"use client";

import { useEffect, useMemo, useState } from "react";
import type { Review } from "@/lib/types";

interface MiniReview {
  quote: string;
  author: string;
}

const ROTATE_MS = 5000;

function toMini(r: Review): MiniReview {
  const since = r.guestSince ? `, guest since ${r.guestSince}` : "";
  return { quote: r.quote, author: `${r.authorName}${since}` };
}

export function HeroReviewCard({ reviews }: { reviews?: Review[] }) {
  const items = useMemo<MiniReview[]>(
    () =>
      reviews
        ? // Surface concise quotes first — this card is small, so shorter
          // reviews read better and rarely get clipped by the line clamp.
          reviews
            .map(toMini)
            .sort((a, b) => a.quote.length - b.quote.length)
        : [],
    [reviews]
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [items]);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [items.length]);

  // No real reviews yet — don't show a card at all.
  if (items.length === 0) return null;

  return (
    <div className="absolute -bottom-6 -left-6 hidden w-56 rounded-2xl bg-cream-50 p-5 shadow-soft sm:block">
      <p className="eyebrow">Guest favourite</p>
      <div className="relative mt-2 min-h-[7rem]">
        {items.map((r, i) => (
          <div
            key={i}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <p className="line-clamp-3 font-serif text-lg leading-tight text-ink-900">
              “{r.quote}”
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest text-ink-500">
              — {r.author}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
