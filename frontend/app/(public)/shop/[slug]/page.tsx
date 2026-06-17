import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import { OrderForm } from "@/components/OrderForm";
import type { Product } from "@/lib/types";

export const revalidate = 60;

interface Props {
  params: { slug: string };
}

async function safeGetProduct(slug: string): Promise<Product | null> {
  try {
    return await api.getProductBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const slug = (params.slug ?? "").trim();
  if (!slug) return { title: "Shop · Mr. & Mrs. Cuts Salon" };
  const product = await safeGetProduct(slug);
  if (!product) return { title: "Not found · Mr. & Mrs. Cuts Salon" };
  return {
    title: `${product.name} · Shop · Mr. & Mrs. Cuts Salon`,
    description:
      product.shortDescription ??
      product.description.slice(0, 200),
  };
}

function formatMoney(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

export default async function ProductDetailPage({ params }: Props) {
  const slug = (params.slug ?? "").trim();
  if (!slug) notFound();

  const product = await safeGetProduct(slug);
  if (!product) notFound();

  const outOfStock =
    product.stockQuantity != null && product.stockQuantity <= 0;

  return (
    <article className="section">
      <div className="container-page max-w-6xl">
        <Link
          href="/shop"
          className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 hover:text-ink-900"
        >
          ← Shop
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="relative overflow-hidden rounded-2xl bg-cream-100">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="eager"
                  decoding="async"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-xs uppercase tracking-widest text-ink-400">
                  No image
                </div>
              )}
              {outOfStock && (
                <span className="absolute left-4 top-4 rounded-full bg-ink-900/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-cream-50">
                  Out of stock
                </span>
              )}
            </div>
          </div>

          <div>
            {product.category && (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-600">
                {product.category}
              </p>
            )}
            <h1 className="mt-3 font-serif text-4xl leading-tight text-ink-900">
              {product.name}
            </h1>
            <p className="mt-4 font-serif text-3xl text-gold-600">
              ₹{formatMoney(product.price)}
            </p>

            {product.shortDescription && (
              <p className="mt-5 text-base leading-relaxed text-ink-700">
                {product.shortDescription}
              </p>
            )}

            {product.description && (
              <div
                className="prose-blog mt-6 text-sm"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(product.description),
                }}
              />
            )}

            <div className="mt-8 rounded-2xl border border-ink-900/10 bg-cream-50 p-6 shadow-soft">
              <h2 className="font-serif text-xl text-ink-900">
                Order this product
              </h2>
              <p className="mt-1 text-xs uppercase tracking-widest text-ink-500">
                Reception will call you to confirm.
              </p>
              <div className="mt-5">
                <OrderForm product={product} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
