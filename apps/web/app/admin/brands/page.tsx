import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { createBrandPageAction } from "@/app/admin/actions";
import { adminListBrands } from "@/lib/admin-api";

async function BrandsContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  await connection();
  const params = await searchParams;
  let brands = null;
  try {
    brands = await adminListBrands();
  } catch {
    return <p className="text-sm text-ink-soft">Unable to load brands. <Link href="/admin/brands" className="underline">Retry</Link></p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Brands</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Create a brand here, or from the product form while adding a listing.
      </p>
      {params.error ? <p className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{params.error}</p> : null}
      {params.message ? <p className="mt-4 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{params.message}</p> : null}
      <form action={createBrandPageAction} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-ink/10 bg-foam p-4">
        <label className="block text-sm">
          Name
          <input name="name" required className="mt-1 border border-ink/15 bg-foam px-3 py-2" />
        </label>
        <button className="bg-ink px-4 py-2 text-sm font-semibold text-foam">Add brand</button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl border border-ink/10 bg-foam">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Products</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id} className="border-b border-ink/5">
                <td className="px-4 py-3">
                  <Link href={`/admin/products?brandId=${brand.id}`} className="font-semibold underline-offset-4 hover:underline">
                    {brand.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{brand.slug}</td>
                <td className="px-4 py-3">{brand._count?.products ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading brands...</p>}>
      <BrandsContent searchParams={searchParams} />
    </Suspense>
  );
}
