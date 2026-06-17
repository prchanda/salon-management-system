"use client";

import { useEffect, useMemo, useState } from "react";
import type { Review } from "@/lib/types";

interface Quote {
  quote: string;
  author: string;
}

const ROTATE_MS = 6000;

function toQuote(r: Review): Quote {
  const since = r.guestSince ? `, guest since ${r.guestSince}` : "";
  return { quote: r.quote, author: `${r.authorName}${since}` };
}

export function RotatingTestimonials({ reviews }: { reviews?: Review[] }) {
  const items = useMemo<Quote[]>(
    () => (reviews ? reviews.map(toQuote) : []),
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

  // No real reviews yet — render nothing so no placeholder quotes show.
  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-gold-400" aria-hidden>
        ★ ★ ★ ★ ★
      </p>
      <div className="relative mt-8 min-h-[10rem] sm:min-h-[11rem] lg:min-h-[13rem]">
        {items.map((r, i) => (
          <figure
            key={i}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <blockquote className="font-serif text-2xl leading-snug sm:text-3xl lg:text-4xl">
              “{r.quote}”
            </blockquote>
            <figcaption className="mt-8 text-[11px] uppercase tracking-widest text-cream-100/70">
              — {r.author}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show review ${i + 1}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${
              i === index
                ? "w-6 bg-gold-400"
                : "w-1.5 bg-cream-100/40 hover:bg-cream-100/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
