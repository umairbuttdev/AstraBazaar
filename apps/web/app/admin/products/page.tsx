import Link from "next/link";
import { Suspense } from "react";
import { adminListProducts } from "@/lib/admin-api";

type ProductsPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

async function ProductsContent({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const products = await adminListProducts();

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-ink">Products</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {products.length} product{products.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam transition-colors hover:bg-copper"
        >
          New product
        </Link>
      </div>

      {params.error ? (
        <p className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {params.error}
        </p>
      ) : null}
      {params.message ? (
        <p className="mb-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {params.message}
        </p>
      ) : null}

      {products.length === 0 ? (
        <p className="text-ink-soft">No products yet.</p>
      ) : (
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="font-display text-xl text-ink transition-colors hover:text-copper"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-sm text-ink-soft">
                  {product.slug} · {product.status.toLowerCase()} ·{" "}
                  {product.variants.length} variant
                  {product.variants.length === 1 ? "" : "s"}
                </p>
              </div>
              <Link
                href={`/admin/products/${product.id}`}
                className="text-sm text-ink underline underline-offset-4"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function AdminProductsPage(props: ProductsPageProps) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading products...</p>}>
      <ProductsContent {...props} />
    </Suspense>
  );
}
