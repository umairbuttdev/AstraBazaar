import Link from "next/link";
import { catalogHref, type CatalogState } from "@/lib/catalog";
import { ProductCard, ProductCardSkeleton } from "@/components/ui/product-card";
import { SearchInput } from "@/components/ui/search-input";
import type { Category, Product } from "@/lib/types";
import { FilterSidebar } from "./filter-sidebar";
import { MobileFilters } from "./mobile-filters";
import { SortSelect } from "./sort-select";

type CatalogExperienceProps = {
  pathname: string;
  state: CatalogState;
  fixedCategory?: string;
  title: string;
  eyebrow?: string;
  description?: string;
  breadcrumbs: Array<{ href: string; label: string }>;
  subcategories?: Category[];
  categories: Array<{ slug: string; name: string }>;
  brands: Array<{ slug: string; name: string }>;
  showCategories: boolean;
  products: Product[];
  total: number;
  totalPages: number;
  error?: boolean;
  emptyQuery?: boolean;
};

export function CatalogExperience({
  pathname,
  state,
  fixedCategory,
  title,
  eyebrow,
  description,
  breadcrumbs,
  subcategories = [],
  categories,
  brands,
  showCategories,
  products,
  total,
  totalPages,
  error = false,
  emptyQuery = false,
}: CatalogExperienceProps) {
  const clearHref = catalogHref(
    pathname,
    {
      q: pathname === "/search" ? state.q : undefined,
      category: fixedCategory,
      brands: [],
      inStock: false,
      deals: false,
      page: 1,
    },
    {},
    fixedCategory,
  );
  const chips = activeChips(pathname, state, fixedCategory, brands, categories);
  const returnTo = catalogHref(pathname, state, {}, fixedCategory);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-body-sm text-foreground-muted">
        <ol className="flex flex-wrap items-center gap-2">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.href} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-foreground">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-primary">
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <header className="mt-4 border-b border-border pb-5">
        {eyebrow ? <p className="text-caption text-primary">{eyebrow}</p> : null}
        <h1 className="text-h1 mt-2 text-foreground">{title}</h1>
        {description ? (
          <p className="text-body mt-2 max-w-2xl text-foreground-muted">{description}</p>
        ) : null}
        {pathname === "/search" && state.q ? (
          <div className="mt-4 max-w-xl">
            <SearchInput
              id="search-results"
              action="/search"
              defaultValue={state.q}
              placeholder="Search products"
            />
          </div>
        ) : null}
        {subcategories.length > 0 ? (
          <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1">
            {subcategories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="shrink-0 rounded-full border border-border px-3.5 py-2 text-sm text-foreground hover:border-primary hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      {emptyQuery ? (
        <EmptyQuery categories={categories} />
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground-muted">
              {error
                ? "Products are unavailable right now."
                : `${total} ${total === 1 ? "product" : "products"}`}
            </p>
            <div className="flex items-center gap-2">
              <MobileFilters
                pathname={pathname}
                q={state.q}
                sort={state.sort}
                category={fixedCategory ? undefined : state.category}
                categories={categories}
                brands={brands}
                selectedBrands={state.brands}
                minPrice={state.minPrice}
                maxPrice={state.maxPrice}
                inStock={state.inStock}
                deals={state.deals}
                showCategories={showCategories && !fixedCategory}
              />
              <SortSelect
                pathname={pathname}
                state={state}
                fixedCategory={fixedCategory}
                hasQuery={Boolean(state.q)}
              />
            </div>
          </div>

          {chips.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="inline-flex items-center gap-2 rounded-full bg-surface-secondary px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  {chip.label}
                  <span aria-hidden>×</span>
                  <span className="sr-only">Remove {chip.label}</span>
                </Link>
              ))}
              <Link href={clearHref} className="text-sm font-medium text-primary">
                Clear all
              </Link>
            </div>
          ) : null}

          <div className="mt-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
            <FilterSidebar
              pathname={pathname}
              state={state}
              fixedCategory={fixedCategory}
              categories={categories}
              brands={brands}
              showCategories={showCategories}
            />
            <div>
              {error ? (
                <div className="rounded-lg border border-border bg-surface px-5 py-8">
                  <p className="text-h3">We couldn&apos;t load products</p>
                  <p className="text-body mt-2 text-foreground-muted">
                    Check that the catalog API is running, then try again.
                  </p>
                  <Link
                    href={returnTo}
                    className="mt-5 inline-flex rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-foam"
                  >
                    Retry
                  </Link>
                </div>
              ) : products.length === 0 ? (
                <EmptyResults
                  searched={Boolean(state.q)}
                  categories={categories}
                />
              ) : (
                <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
                  {products.map((product) => (
                    <li key={product.id}>
                      <ProductCard product={product} returnTo={returnTo} />
                    </li>
                  ))}
                </ul>
              )}

              {totalPages > 1 ? (
                <nav
                  aria-label="Pagination"
                  className="mt-10 flex items-center justify-between gap-4"
                >
                  {state.page > 1 ? (
                    <Link
                      href={catalogHref(pathname, state, { page: state.page - 1 }, fixedCategory)}
                      className="rounded-md border border-border px-4 py-2 text-sm font-medium"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="rounded-md border border-border px-4 py-2 text-sm text-foreground-muted">
                      Previous
                    </span>
                  )}
                  <p className="text-sm text-foreground-muted">
                    Page {state.page} of {totalPages}
                  </p>
                  {state.page < totalPages ? (
                    <Link
                      href={catalogHref(pathname, state, { page: state.page + 1 }, fixedCategory)}
                      className="rounded-md border border-border px-4 py-2 text-sm font-medium"
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="rounded-md border border-border px-4 py-2 text-sm text-foreground-muted">
                      Next
                    </span>
                  )}
                </nav>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function activeChips(
  pathname: string,
  state: CatalogState,
  fixedCategory: string | undefined,
  brands: Array<{ slug: string; name: string }>,
  categories: Array<{ slug: string; name: string }>,
) {
  const chips: Array<{ label: string; href: string }> = [];
  const href = (patch: Partial<CatalogState>) =>
    catalogHref(pathname, state, { ...patch, page: 1 }, fixedCategory);

  if (state.category && state.category !== fixedCategory) {
    const name =
      categories.find((category) => category.slug === state.category)?.name ??
      state.category;
    chips.push({ label: name, href: href({ category: undefined }) });
  }
  for (const slug of state.brands) {
    chips.push({
      label: brands.find((brand) => brand.slug === slug)?.name ?? slug,
      href: href({ brands: state.brands.filter((brand) => brand !== slug) }),
    });
  }
  if (state.minPrice || state.maxPrice) {
    const label =
      state.minPrice && state.maxPrice
        ? `$${state.minPrice}–$${state.maxPrice}`
        : state.minPrice
          ? `From $${state.minPrice}`
          : `Up to $${state.maxPrice}`;
    chips.push({
      label,
      href: href({ minPrice: undefined, maxPrice: undefined }),
    });
  }
  if (state.inStock) chips.push({ label: "In stock", href: href({ inStock: false }) });
  if (state.deals) chips.push({ label: "On sale", href: href({ deals: false }) });
  return chips;
}

function EmptyQuery({ categories }: { categories: Array<{ slug: string; name: string }> }) {
  return (
    <div className="mt-8 max-w-xl">
      <p className="text-h3">What are you looking for?</p>
      <p className="text-body mt-2 text-foreground-muted">
        Search by product name, brand, or category.
      </p>
      <div className="mt-5">
        <SearchInput id="empty-search" action="/search" placeholder="Search products" />
      </div>
      {categories.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary hover:text-primary"
            >
              {category.name}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EmptyResults({
  searched,
  categories,
}: {
  searched: boolean;
  categories: Array<{ slug: string; name: string }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-5 py-8">
      <p className="text-h3">
        {searched
          ? "We couldn't find what you're looking for."
          : "No products match these filters."}
      </p>
      <ul className="text-body mt-3 list-disc space-y-1 pl-5 text-foreground-muted">
        {searched ? (
          <>
            <li>Check the spelling</li>
            <li>Try fewer words</li>
            <li>Browse a category instead</li>
          </>
        ) : (
          <li>Clear a filter or choose another category</li>
        )}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/products"
          className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-foam"
        >
          Browse all products
        </Link>
        {categories.slice(0, 4).map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="rounded-md border border-border px-4 py-2.5 text-sm font-medium"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div>
      <div className="h-4 w-40 animate-pulse rounded bg-surface-secondary" />
      <div className="mt-4 h-10 w-64 animate-pulse rounded bg-surface-secondary" />
      <div className="mt-3 h-4 w-80 animate-pulse rounded bg-surface-secondary" />
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
