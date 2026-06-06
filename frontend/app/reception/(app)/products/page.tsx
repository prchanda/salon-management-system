import Link from "next/link";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

async function safeList(): Promise<Product[]> {
  try {
    return await api.getAdminProducts();
  } catch {
    return [];
  }
}

function formatPrice(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default async function ReceptionProductsPage() {
  const products = await safeList();

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink-900">Shop</h1>
          <p className="mt-1 text-sm text-ink-500">
            Manage the retail catalogue — skin, hair, and styling products
            customers can browse and order from the landing page.
          </p>
        </div>
        <Link
          href="/reception/products/new"
          className="btn-primary self-start whitespace-nowrap sm:self-auto"
        >
          New product
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-xs">
        <Link
          href="/reception/orders"
          className="inline-flex items-center gap-2 rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2 font-semibold uppercase tracking-widest text-ink-700 hover:border-gold-600 hover:text-gold-600"
        >
          View incoming orders →
        </Link>
        <Link
          href="/shop"
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg border border-ink-900/10 bg-cream-50 px-4 py-2 font-semibold uppercase tracking-widest text-ink-700 hover:border-gold-600 hover:text-gold-600"
        >
          Preview public shop ↗
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink-900/10 bg-cream-50">
        {products.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-500">
            No products yet. Click{" "}
            <span className="font-semibold">New product</span> to list the
            first one.
          </div>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="divide-y divide-ink-900/5 md:hidden">
              {products.map((p) => (
                <li key={p.id} className="flex gap-3 p-4">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-cream-100 text-[10px] uppercase tracking-widest text-ink-400">
                      —
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/reception/products/${p.id}/edit`}
                        className="min-w-0 font-serif text-base text-ink-900 hover:text-gold-600"
                      >
                        <span className="break-words">{p.name}</span>
                      </Link>
                      <span className="shrink-0 font-serif text-sm text-gold-600">
                        ₹{formatPrice(p.price)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {p.category || "—"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600">
                      <span>
                        Stock:{" "}
                        {p.stockQuantity == null ? (
                          <span className="text-ink-400">untracked</span>
                        ) : p.stockQuantity === 0 ? (
                          <span className="font-semibold text-red-700">0</span>
                        ) : (
                          p.stockQuantity
                        )}
                      </span>
                      {p.isActive ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-widest text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                          Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-widest text-ink-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
                          Hidden
                        </span>
                      )}
                      <span className="text-ink-400">
                        Updated {formatDate(p.updatedAt)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {p.isActive && (
                        <Link
                          href={`/shop/${p.slug}`}
                          target="_blank"
                          className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 hover:text-ink-900"
                        >
                          View
                        </Link>
                      )}
                      <Link
                        href={`/reception/products/${p.id}/edit`}
                        className="text-[11px] font-semibold uppercase tracking-widest text-gold-600 hover:text-ink-900"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden md:block md:overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-cream-100 text-[11px] uppercase tracking-widest text-ink-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Product</th>
                    <th className="px-5 py-3 text-left">Category</th>
                    <th className="px-5 py-3 text-right">Price</th>
                    <th className="px-5 py-3 text-right">Stock</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Updated</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-ink-900/5">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cream-100 text-[10px] uppercase tracking-widest text-ink-400">
                              —
                            </div>
                          )}
                          <Link
                            href={`/reception/products/${p.id}/edit`}
                            className="font-serif text-base text-ink-900 hover:text-gold-600"
                          >
                            {p.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-ink-500">
                        {p.category || "—"}
                      </td>
                      <td className="px-5 py-4 text-right font-serif text-gold-600">
                        ₹{formatPrice(p.price)}
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-ink-600">
                        {p.stockQuantity == null ? (
                          <span className="text-ink-400">untracked</span>
                        ) : p.stockQuantity === 0 ? (
                          <span className="font-semibold text-red-700">0</span>
                        ) : (
                          p.stockQuantity
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {p.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-green-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
                            Hidden
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-ink-500">
                        {formatDate(p.updatedAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          {p.isActive && (
                            <Link
                              href={`/shop/${p.slug}`}
                              target="_blank"
                              className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 hover:text-ink-900"
                            >
                              View
                            </Link>
                          )}
                          <Link
                            href={`/reception/products/${p.id}/edit`}
                            className="text-[11px] font-semibold uppercase tracking-widest text-gold-600 hover:text-ink-900"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
