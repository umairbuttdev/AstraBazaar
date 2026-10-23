import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { updateInventoryAction } from "@/app/admin/actions";
import { AdminPager } from "@/components/admin/admin-pager";
import { InventoryAdjust } from "@/components/admin/inventory-adjust";
import { adminListInventory } from "@/lib/admin-api";

function listHref(query: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const text = params.toString();
  return text ? `/admin/inventory?${text}` : "/admin/inventory";
}

async function InventoryContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  let rows = null;
  try {
    rows = await adminListInventory({ page, q: params.q, stock: params.stock });
  } catch {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Stock</h1>
        <p className="mt-3 text-sm text-ink-soft">Unable to load inventory.</p>
        <Link href="/admin/inventory" className="mt-4 inline-flex text-sm font-semibold underline">Retry</Link>
      </div>
    );
  }

  const query = { q: params.q, stock: params.stock };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Stock</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        On-hand quantity is set directly. Reserved units stay reserved, and available stock is on hand minus reserved. There is no inventory movement log.
      </p>
      {params.error ? <p className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{params.error}</p> : null}
      {params.message ? <p className="mt-4 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{params.message}</p> : null}
      <form className="mt-4 flex flex-wrap gap-3">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Product, variant, or SKU" className="rounded-md border border-ink/15 bg-foam px-3 py-2 text-sm" />
        <select name="stock" defaultValue={params.stock ?? ""} className="rounded-md border border-ink/15 bg-foam px-3 py-2 text-sm">
          <option value="">All stock</option>
          <option value="low">Low (1–5 available)</option>
          <option value="out">Out of stock</option>
        </select>
        <button className="bg-ink px-4 py-2 text-sm font-semibold text-foam">Filter</button>
      </form>
      <p className="mt-3 text-sm text-ink-soft">
        {rows.total} versions across{" "}
        {new Set(rows.items.map((row) => row.product.id)).size} products
      </p>
      <ul className="mt-4 divide-y divide-ink/10 rounded-xl border border-ink/10 bg-foam">
        {rows.items.length === 0 ? (
          <li className="px-4 py-6 text-sm text-ink-soft">No variants in this view.</li>
        ) : (
          (() => {
            const groups = new Map<
              string,
              { product: (typeof rows.items)[number]["product"]; items: typeof rows.items }
            >();
            for (const row of rows.items) {
              const current = groups.get(row.product.id);
              if (current) current.items.push(row);
              else groups.set(row.product.id, { product: row.product, items: [row] });
            }
            return [...groups.values()].map((group) => (
              <li key={group.product.id} className="px-4 py-4">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/admin/products/${group.product.id}`}
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    {group.product.name}
                  </Link>
                  <p className="text-xs text-ink-soft">
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "version" : "versions"} ·{" "}
                    {group.product.status.toLowerCase()}
                  </p>
                </div>
                <ul className="space-y-3">
                  {group.items.map((row) => (
                    <li
                      key={row.id}
                      className="grid gap-3 rounded-lg border border-ink/10 bg-mist/40 px-3 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {row.variantName ?? "Version"}
                        </p>
                        <p className="text-sm text-ink-soft">
                          {row.sku} · available {row.available}
                        </p>
                      </div>
                      <InventoryAdjust
                        variantId={row.variantId}
                        quantity={row.quantity}
                        reserved={row.reserved}
                        stock={params.stock}
                        q={params.q}
                        page={page}
                        action={updateInventoryAction}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            ));
          })()
        )}
      </ul>
      <AdminPager page={rows.page} totalPages={rows.totalPages} href={(next) => listHref(query, next)} />
    </div>
  );
}

export default function AdminInventoryPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading stock...</p>}>
      <InventoryContent {...props} />
    </Suspense>
  );
}
