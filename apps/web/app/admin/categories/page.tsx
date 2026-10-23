import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { createCategoryPageAction } from "@/app/admin/actions";
import { adminListCategories } from "@/lib/admin-api";
import {
  buildCategoryTree,
  flattenCategoryTree,
} from "@/lib/category-tree";

async function CategoriesContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; parent?: string }>;
}) {
  await connection();
  const params = await searchParams;
  let categories = null;
  try {
    categories = await adminListCategories();
  } catch {
    return <p className="text-sm text-ink-soft">Unable to load categories. <Link href="/admin/categories" className="underline">Retry</Link></p>;
  }

  const ordered = flattenCategoryTree(buildCategoryTree(categories));
  const selectedParent = ordered.find((category) => category.id === params.parent);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Categories</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Header categories have no parent. Choose a parent to add a subcategory under it.
        You can keep nesting, and every category you add appears in the store header.
      </p>
      {params.error ? <p className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{params.error}</p> : null}
      {params.message ? <p className="mt-4 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{params.message}</p> : null}
      <form action={createCategoryPageAction} className="mt-4 grid gap-3 rounded-xl border border-ink/10 bg-foam p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-end">
        <label className="block text-sm">
          Name
          <input name="name" required className="mt-1 w-full border border-ink/15 bg-foam px-3 py-2" />
        </label>
        <label className="block text-sm">
          Parent
          <select name="parentId" defaultValue={selectedParent?.id ?? ""} className="mt-1 w-full border border-ink/15 bg-foam px-3 py-2">
            <option value="">None — header category</option>
            {ordered.map((category) => (
              <option key={category.id} value={category.id}>{category.path}</option>
            ))}
          </select>
        </label>
        <button className="bg-ink px-4 py-2 text-sm font-semibold text-foam">
          {selectedParent ? "Add subcategory" : "Add category"}
        </button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl border border-ink/10 bg-foam">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Products</th>
              <th className="px-4 py-2">Subcategories</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((category) => (
              <tr key={category.id} className="border-b border-ink/5">
                <td className="px-4 py-3" style={{ paddingLeft: 16 + category.depth * 20 }}>
                  <Link href={`/admin/products?categoryId=${category.id}`} className="font-semibold underline-offset-4 hover:underline">
                    {category.name}
                  </Link>
                  {category.depth > 0 ? (
                    <p className="text-xs text-ink-soft">{category.path}</p>
                  ) : (
                    <p className="text-xs text-ink-soft">Header</p>
                  )}
                </td>
                <td className="px-4 py-3">{category.slug}</td>
                <td className="px-4 py-3">{categories.find((item) => item.id === category.id)?._count?.products ?? 0}</td>
                <td className="px-4 py-3">{category.children.length}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/categories?parent=${category.id}`} className="text-sm font-semibold underline-offset-4 hover:underline">
                    Add subcategory
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; parent?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading categories...</p>}>
      <CategoriesContent searchParams={searchParams} />
    </Suspense>
  );
}
