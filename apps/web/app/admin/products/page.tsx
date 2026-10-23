import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { deleteProductAction } from "@/app/admin/actions";
import { AdminPager } from "@/components/admin/admin-pager";
import { DeleteProductButton } from "@/components/admin/product-actions";
import { adminListBrands, adminListCategories, adminListProducts } from "@/lib/admin-api";

function hrefFor(query: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const text = params.toString();
  return text ? `/admin/products?${text}` : "/admin/products";
}

async function ProductsContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  let products = null;
  let loadError = false;
  try {
    const [list, categories, brands] = await Promise.all([
      adminListProducts({
        page,
        q: params.q,
        status: params.status,
        categoryId: params.categoryId,
        brandId: params.brandId,
      }),
      adminListCategories(),
      adminListBrands(),
    ]);
    products = { list, categories, brands };
  } catch {
    loadError = true;
  }

  if (loadError || !products) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Products</h1>
        <p className="mt-3 text-sm text-ink-soft">Unable to load products.</p>
        <Link href="/admin/products" className="mt-4 inline-flex text-sm font-semibold underline">Retry</Link>
      </div>
    );
  }

  const query = {
    q: params.q,
    status: params.status,
    categoryId: params.categoryId,
    brandId: params.brandId,
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-ink-soft">{products.list.total} in this view</p>
        </div>
        <Link href="/admin/products/new" className="bg-ink px-4 py-2 text-sm font-semibold text-foam hover:bg-copper">
          New product
        </Link>
      </div>
      {params.error ? <p className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{params.error}</p> : null}
      {params.message ? <p className="mt-4 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{params.message}</p> : null}
      <form className="mt-4 grid gap-3 md:grid-cols-5">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Name, page link, or stock code" className="rounded-md border border-ink/15 bg-foam px-3 py-2 text-sm md:col-span-2" />
        <select name="status" defaultValue={params.status ?? ""} className="rounded-md border border-ink/15 bg-foam px-3 py-2 text-sm">
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select name="categoryId" defaultValue={params.categoryId ?? ""} className="rounded-md border border-ink/15 bg-foam px-3 py-2 text-sm">
          <option value="">Any category</option>
          {products.categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <select name="brandId" defaultValue={params.brandId ?? ""} className="rounded-md border border-ink/15 bg-foam px-3 py-2 text-sm">
          <option value="">Any brand</option>
          {products.brands.map((brand) => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
        <button className="bg-ink px-4 py-2 text-sm font-semibold text-foam md:col-span-5 md:w-fit">Search</button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl border border-ink/10 bg-foam">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Brand</th>
              <th className="px-4 py-2">Variants</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.list.items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-ink-soft">No products in this view.</td></tr>
            ) : products.list.items.map((product) => (
              <tr key={product.id} className="border-b border-ink/5">
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${product.id}`} className="font-semibold underline-offset-4 hover:underline">{product.name}</Link>
                  <p className="text-xs text-ink-soft">{product.variants[0]?.sku ?? product.slug}</p>
                </td>
                <td className="px-4 py-3">{product.category?.name ?? "—"}</td>
                <td className="px-4 py-3">{product.brand?.name ?? "—"}</td>
                <td className="px-4 py-3">{product.variants.length}</td>
                <td className="px-4 py-3">{product.status.toLowerCase()}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-sm font-semibold text-ink underline underline-offset-4"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton
                      productId={product.id}
                      productName={product.name}
                      action={deleteProductAction}
                      from="list"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPager page={products.list.page} totalPages={products.list.totalPages} href={(next) => hrefFor(query, next)} />
    </div>
  );
}

export default function AdminProductsPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading products...</p>}>
      <ProductsContent {...props} />
    </Suspense>
  );
}
