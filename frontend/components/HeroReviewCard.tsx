"use client";

import { useEffect, useMemo, useState } from "react";
import type { Review } from "@/lib/types";

interface MiniReview {
  quote: string;
  author: string;
}

const FALLBACK: MiniReview[] = [
  {
    quote: "Feels less like a salon, more like a quiet ritual.",
    author: "Riya M., regular since 2022",
  },
  {
    quote: "The only place that gets my curls right.",
    author: "Tanvi B., regular since 2021",
  },
  {
    quote: "Calm, kind, and genuinely skilled hands.",
    author: "Meera J., regular since 2020",
  },
  {
    quote: "I leave lighter every single time.",
    author: "Aditi P., regular since 2023",
  },
];

const ROTATE_MS = 5000;

function toMini(r: Review): MiniReview {
  const since = r.guestSince ? `, guest since ${r.guestSince}` : "";
  return { quote: r.quote, author: `${r.authorName}${since}` };
}

export function HeroReviewCard({ reviews }: { reviews?: Review[] }) {
  const items = useMemo<MiniReview[]>(
    () => (reviews && reviews.length > 0 ? reviews.map(toMini) : FALLBACK),
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

  return (
    <div className="absolute -bottom-6 -left-6 hidden w-56 rounded-2xl bg-cream-50 p-5 shadow-soft sm:block">
      <p className="eyebrow">Guest favourite</p>
      <div className="relative mt-2 min-h-[5.5rem]">
        {items.map((r, i) => (
          <div
            key={i}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <p className="font-serif text-lg leading-tight text-ink-900">
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
