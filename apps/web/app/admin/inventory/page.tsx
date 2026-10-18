import { Suspense } from "react";
import { updateInventoryAction } from "@/app/admin/actions";
import { adminListInventory } from "@/lib/admin-api";

type InventoryPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

async function InventoryContent({ searchParams }: InventoryPageProps) {
  const params = await searchParams;
  const rows = await adminListInventory();

  return (
    <>
      <div className="mb-8">
        <h2 className="font-display text-2xl text-ink">Inventory</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Adjust on-hand quantity per variant.
        </p>
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

      {rows.length === 0 ? (
        <p className="text-ink-soft">No inventory rows yet.</p>
      ) : (
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {rows.map((row) => (
            <li
              key={row.id}
              className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <p className="font-display text-xl text-ink">
                  {row.product.name}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {row.variantName ?? row.sku} · reserved {row.reserved} ·
                  available {row.available} · {row.product.status.toLowerCase()}
                </p>
              </div>
              <form
                action={updateInventoryAction}
                className="flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="variantId" value={row.variantId} />
                <label className="text-sm text-ink-soft">
                  Qty
                  <input
                    type="number"
                    name="quantity"
                    min={0}
                    defaultValue={row.quantity}
                    className="ml-2 w-24 border border-ink/15 bg-foam px-2 py-1 text-ink"
                  />
                </label>
                <button
                  type="submit"
                  className="bg-ink px-4 py-2 text-sm font-semibold text-foam transition-colors hover:bg-copper"
                >
                  Update
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function AdminInventoryPage(props: InventoryPageProps) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading inventory...</p>}>
      <InventoryContent {...props} />
    </Suspense>
  );
}
