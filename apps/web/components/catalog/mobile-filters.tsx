"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

type Option = { slug: string; name: string };

type MobileFiltersProps = {
  pathname: string;
  q?: string;
  sort?: string;
  category?: string;
  categories: Option[];
  brands: Option[];
  selectedBrands: string[];
  minPrice?: string;
  maxPrice?: string;
  inStock: boolean;
  deals: boolean;
  showCategories: boolean;
};

export function MobileFilters({
  pathname,
  q,
  sort,
  category,
  categories,
  brands,
  selectedBrands,
  minPrice,
  maxPrice,
  inStock,
  deals,
  showCategories,
}: MobileFiltersProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);

  const close = () => {
    dialogRef.current?.close();
    setOpen(false);
  };

  const openDialog = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground lg:hidden"
      >
        Filter
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-x-0 bottom-0 m-0 w-full max-w-none rounded-t-lg border-0 bg-surface p-0 text-foreground backdrop:bg-ink/45"
        onClose={() => setOpen(false)}
      >
        <form
          className="flex max-h-[85svh] flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const params = new URLSearchParams();
            for (const [key, value] of data.entries()) {
              const text = String(value).trim();
              if (text) params.append(key, text);
            }
            const query = params.toString();
            router.push(query ? `${pathname}?${query}` : pathname);
            close();
          }}
        >
          {q ? <input type="hidden" name="q" value={q} /> : null}
          {sort ? <input type="hidden" name="sort" value={sort} /> : null}

          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 id={titleId} className="text-h3">
              Filters
            </h2>
            <button
              type="button"
              onClick={close}
              className="rounded-md px-2 py-1 text-sm text-foreground-muted hover:bg-surface-secondary"
            >
              Close
            </button>
          </div>

          <div className="space-y-6 overflow-y-auto px-5 py-5">
            {showCategories && categories.length > 0 ? (
              <fieldset>
                <legend className="text-sm font-semibold">Category</legend>
                <div className="mt-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      defaultChecked={!category}
                    />
                    All categories
                  </label>
                  {categories.map((item) => (
                    <label key={item.slug} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="category"
                        value={item.slug}
                        defaultChecked={category === item.slug}
                      />
                      {item.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {brands.length > 0 ? (
              <fieldset>
                <legend className="text-sm font-semibold">Brand</legend>
                <div className="mt-3 space-y-2">
                  {brands.map((brand) => (
                    <label key={brand.slug} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="brand"
                        value={brand.slug}
                        defaultChecked={selectedBrands.includes(brand.slug)}
                      />
                      {brand.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <fieldset>
              <legend className="text-sm font-semibold">Price</legend>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="text-foreground-muted">Min</span>
                  <input
                    name="minPrice"
                    inputMode="decimal"
                    defaultValue={minPrice}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-foreground-muted">Max</span>
                  <input
                    name="maxPrice"
                    inputMode="decimal"
                    defaultValue={maxPrice}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2"
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">Availability</legend>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" name="inStock" value="1" defaultChecked={inStock} />
                In stock
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="deals" value="1" defaultChecked={deals} />
                On sale
              </label>
            </fieldset>
          </div>

          <div className="flex gap-3 border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams();
                if (q) params.set("q", q);
                const query = params.toString();
                router.push(query ? `${pathname}?${query}` : pathname);
                close();
              }}
              className="flex-1 rounded-md border border-border px-4 py-3 text-sm font-semibold"
            >
              Clear all
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-foam"
            >
              Apply
            </button>
          </div>
        </form>
        {open ? <span className="sr-only">Filter dialog open</span> : null}
      </dialog>
    </>
  );
}
