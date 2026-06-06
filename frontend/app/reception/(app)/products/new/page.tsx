import { ProductEditor } from "@/components/reception/ProductEditor";

export const metadata = {
  title: "New product · Reception",
};

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-ink-900">New product</h1>
      <p className="mt-1 text-sm text-ink-500">
        Add a retail item — skin, hair, styling, or any other in-store
        product. Customers can browse it on the landing page and place an
        order.
      </p>
      <div className="mt-8">
        <ProductEditor />
      </div>
    </div>
  );
}
