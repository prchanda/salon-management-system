import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { ProductEditor } from "@/components/reception/ProductEditor";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

async function safeGet(id: number): Promise<Product | null> {
  try {
    return await api.getAdminProductById(id);
  } catch {
    return null;
  }
}

export default async function EditProductPage({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const product = await safeGet(id);
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">Edit product</h1>
      <p className="mt-1 text-sm text-ink-500">/shop/{product.slug}</p>
      <div className="mt-8">
        <ProductEditor initial={product} />
      </div>
    </div>
  );
}
