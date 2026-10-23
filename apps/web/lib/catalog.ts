export const CATALOG_SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name" },
] as const;

export type CatalogSort = (typeof CATALOG_SORTS)[number]["value"];

export type CatalogState = {
  q?: string;
  category?: string;
  brands: string[];
  minPrice?: string;
  maxPrice?: string;
  inStock: boolean;
  deals: boolean;
  sort?: CatalogSort;
  page: number;
};

const SORTS = new Set<string>(CATALOG_SORTS.map((sort) => sort.value));

function first(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function many(value: string | string[] | undefined) {
  const source = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(source.flatMap((entry) => entry.split(",")).map((item) => item.trim()).filter(Boolean))];
}

export function readCatalogState(
  input: Record<string, string | string[] | undefined>,
  fixedCategory?: string,
): CatalogState {
  const sort = first(input.sort);
  const page = Number(first(input.page) ?? "1");

  return {
    q: first(input.q),
    category: fixedCategory ?? first(input.category),
    brands: many(input.brand),
    minPrice: first(input.minPrice),
    maxPrice: first(input.maxPrice),
    inStock: first(input.inStock) === "1",
    deals: first(input.deals) === "1",
    sort: sort && SORTS.has(sort) ? (sort as CatalogSort) : undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function catalogHref(
  pathname: string,
  state: CatalogState,
  patch: Partial<CatalogState> = {},
  fixedCategory?: string,
) {
  const next: CatalogState = {
    ...state,
    ...patch,
    brands: patch.brands ?? state.brands,
  };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.category && next.category !== fixedCategory) {
    params.set("category", next.category);
  }
  for (const brand of next.brands) {
    params.append("brand", brand);
  }
  if (next.minPrice) params.set("minPrice", next.minPrice);
  if (next.maxPrice) params.set("maxPrice", next.maxPrice);
  if (next.inStock) params.set("inStock", "1");
  if (next.deals) params.set("deals", "1");
  if (next.sort) params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function toggleBrand(brands: string[], slug: string) {
  return brands.includes(slug)
    ? brands.filter((brand) => brand !== slug)
    : [...brands, slug];
}
