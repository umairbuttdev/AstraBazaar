import Link from "next/link";
import {
  catalogHref,
  toggleBrand,
  type CatalogState,
} from "@/lib/catalog";

type Option = { slug: string; name: string };

type FilterSidebarProps = {
  pathname: string;
  state: CatalogState;
  fixedCategory?: string;
  categories: Option[];
  brands: Option[];
  showCategories: boolean;
};

function groupClassName() {
  return "border-b border-border py-4";
}

export function FilterSidebar({
  pathname,
  state,
  fixedCategory,
  categories,
  brands,
  showCategories,
}: FilterSidebarProps) {
  const linkFor = (patch: Partial<CatalogState>) =>
    catalogHref(pathname, state, { ...patch, page: 1 }, fixedCategory);

  return (
    <aside className="hidden lg:block">
      <p className="text-sm font-semibold text-foreground">Filters</p>

      {showCategories && categories.length > 0 ? (
        <details open className={groupClassName()}>
          <summary className="cursor-pointer text-sm font-semibold">Category</summary>
          <ul className="mt-3 space-y-2">
            {categories.map((category) => {
              const active = state.category === category.slug;
              return (
                <li key={category.slug}>
                  <Link
                    href={
                      fixedCategory
                        ? catalogHref(
                            `/categories/${category.slug}`,
                            state,
                            { category: category.slug, page: 1 },
                            category.slug,
                          )
                        : linkFor({
                            category: active ? undefined : category.slug,
                          })
                    }
                    className={`block text-sm ${
                      active
                        ? "font-semibold text-primary"
                        : "text-foreground-muted hover:text-foreground"
                    }`}
                    aria-current={active ? "true" : undefined}
                  >
                    {category.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}

      {brands.length > 0 ? (
        <details open className={groupClassName()}>
          <summary className="cursor-pointer text-sm font-semibold">Brand</summary>
          <ul className="mt-3 space-y-2">
            {brands.map((brand) => {
              const active = state.brands.includes(brand.slug);
              return (
                <li key={brand.slug}>
                  <Link
                    href={linkFor({ brands: toggleBrand(state.brands, brand.slug) })}
                    className="flex items-center gap-2 text-sm text-foreground"
                    aria-current={active ? "true" : undefined}
                  >
                    <span
                      aria-hidden
                      className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                        active
                          ? "border-primary bg-primary text-foam"
                          : "border-border"
                      }`}
                    >
                      {active ? "✓" : ""}
                    </span>
                    {brand.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}

      <details open className={groupClassName()}>
        <summary className="cursor-pointer text-sm font-semibold">Price</summary>
        <form action={pathname} method="get" className="mt-3 grid grid-cols-2 gap-2">
          <HiddenQuery state={state} fixedCategory={fixedCategory} omit={["minPrice", "maxPrice", "page"]} />
          <label className="text-xs text-foreground-muted">
            Min
            <input
              name="minPrice"
              inputMode="decimal"
              defaultValue={state.minPrice}
              className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-xs text-foreground-muted">
            Max
            <input
              name="maxPrice"
              inputMode="decimal"
              defaultValue={state.maxPrice}
              className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm text-foreground"
            />
          </label>
          <button
            type="submit"
            className="col-span-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:border-primary hover:text-primary"
          >
            Apply price
          </button>
        </form>
      </details>

      <details open className={groupClassName()}>
        <summary className="cursor-pointer text-sm font-semibold">Availability</summary>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link
              href={linkFor({ inStock: !state.inStock })}
              className="flex items-center gap-2"
            >
              <span
                aria-hidden
                className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                  state.inStock ? "border-primary bg-primary text-foam" : "border-border"
                }`}
              >
                {state.inStock ? "✓" : ""}
              </span>
              In stock
            </Link>
          </li>
          <li>
            <Link href={linkFor({ deals: !state.deals })} className="flex items-center gap-2">
              <span
                aria-hidden
                className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                  state.deals ? "border-primary bg-primary text-foam" : "border-border"
                }`}
              >
                {state.deals ? "✓" : ""}
              </span>
              On sale
            </Link>
          </li>
        </ul>
      </details>
    </aside>
  );
}

function HiddenQuery({
  state,
  fixedCategory,
  omit,
}: {
  state: CatalogState;
  fixedCategory?: string;
  omit: Array<keyof CatalogState | "page">;
}) {
  const skip = new Set(omit);
  return (
    <>
      {state.q && !skip.has("q") ? (
        <input type="hidden" name="q" value={state.q} />
      ) : null}
      {state.category && state.category !== fixedCategory && !skip.has("category") ? (
        <input type="hidden" name="category" value={state.category} />
      ) : null}
      {!skip.has("brands")
        ? state.brands.map((brand) => (
            <input key={brand} type="hidden" name="brand" value={brand} />
          ))
        : null}
      {state.inStock && !skip.has("inStock") ? (
        <input type="hidden" name="inStock" value="1" />
      ) : null}
      {state.deals && !skip.has("deals") ? (
        <input type="hidden" name="deals" value="1" />
      ) : null}
      {state.sort && !skip.has("sort") ? (
        <input type="hidden" name="sort" value={state.sort} />
      ) : null}
    </>
  );
}
