import Link from "next/link";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const outOfStock =
    product.stockQuantity != null && product.stockQuantity <= 0;

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-900/10 bg-cream-50 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-100">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-widest text-ink-400">
            No image
          </div>
        )}
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-ink-900/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-cream-50">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {product.category && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gold-600">
            {product.category}
          </p>
        )}
        <h3 className="font-serif text-lg leading-snug text-ink-900 group-hover:text-gold-600">
          {product.name}
        </h3>
        {product.shortDescription && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-600">
            {product.shortDescription}
          </p>
        )}
        <div className="mt-4 flex items-baseline justify-between gap-3 pt-3">
          <span className="font-serif text-xl text-gold-600">
            ₹{formatPrice(product.price)}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 group-hover:text-ink-900">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatPrice(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}
