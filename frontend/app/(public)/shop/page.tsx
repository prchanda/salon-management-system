import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

export const metadata = {
  title: "Shop",
  description:
    "Salon-curated skin, hair, and styling products — chosen by our specialists. Browse the catalogue and place an order.",
  alternates: { canonical: "/shop" },
};

export const revalidate = 60;

async function safeGetProducts(): Promise<Product[]> {
  try {
    return await api.getProducts(100);
  } catch {
    return [];
  }
}

export default async function ShopIndexPage() {
  const products = await safeGetProducts();

  const categories = Array.from(
    new Set(
      products
        .map((p) => p.category?.trim())
        .filter((c): c is string => !!c && c.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <section className="section">
      <div className="container-page">
        <div className="max-w-3xl">
          <span className="eyebrow">The Shop</span>
          <h1 className="display mt-4">
            Salon-curated <span className="italic text-gold-600">essentials.</span>
          </h1>
          <p className="lead mt-5 max-w-2xl">
            A small, considered edit of skin, hair, and styling products our
            specialists actually reach for. Browse the catalogue and place an
            order — we&apos;ll confirm by phone or WhatsApp.
          </p>
        </div>

        {categories.length > 1 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {categories.map((c) => (
              <a
                key={c}
                href={`#category-${slugify(c)}`}
                className="rounded-full border border-ink-900/10 bg-cream-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-ink-700 hover:border-gold-600 hover:text-gold-600"
              >
                {c}
              </a>
            ))}
          </div>
        )}

        {products.length === 0 ? (
          <div className="mt-16 rounded-2xl bg-cream-100 p-12 text-center">
            <p className="text-ink-500">
              Our shelves are being curated. New products will appear here
              soon — in the meantime,{" "}
              <Link
                href="/book"
                className="text-gold-600 hover:text-ink-900"
              >
                book a treatment
              </Link>
              .
            </p>
          </div>
        ) : categories.length > 1 ? (
          <div className="mt-14 space-y-16">
            {categories.map((c) => {
              const inCat = products.filter(
                (p) => (p.category ?? "").trim() === c
              );
              if (inCat.length === 0) return null;
              return (
                <div key={c} id={`category-${slugify(c)}`}>
                  <h2 className="font-serif text-2xl text-ink-900">{c}</h2>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {inCat.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              );
            })}
            {(() => {
              const uncategorized = products.filter(
                (p) => !p.category || !p.category.trim()
              );
              if (uncategorized.length === 0) return null;
              return (
                <div>
                  <h2 className="font-serif text-2xl text-ink-900">More</h2>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {uncategorized.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
