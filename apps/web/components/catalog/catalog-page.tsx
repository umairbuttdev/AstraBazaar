import { connection } from "next/server";
import { CatalogExperience } from "@/components/catalog/catalog-experience";
import {
  getBrands,
  getCategories,
  getProductListing,
  type CategoryWithMeta,
  type ProductListResult,
} from "@/lib/api";
import { readCatalogState, type CatalogState } from "@/lib/catalog";
import {
  buildCategoryTree,
  categoryCountMap,
  categoryOptionLabel,
  flattenCategoryTree,
  pruneEmptyCategories,
} from "@/lib/category-tree";

type CatalogPageProps = {
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
  fixedCategory?: CategoryWithMeta;
  mode: "browse" | "search" | "category";
};

export async function CatalogPage({
  pathname,
  searchParams,
  fixedCategory,
  mode,
}: CatalogPageProps) {
  await connection();
  const state = readCatalogState(searchParams, fixedCategory?.slug);
  const emptyQuery = mode === "search" && !state.q;

  let categories: CategoryWithMeta[] = [];
  let brands: Awaited<ReturnType<typeof getBrands>> = [];
  let listing: ProductListResult = {
    items: [],
    total: 0,
    totalPages: 0,
    page: state.page,
    limit: 12,
  };
  let error = false;

  try {
    [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  } catch {
    error = true;
  }

  if (!emptyQuery && !error) {
    try {
      listing = await getProductListing({
        q: state.q,
        category: state.category,
        brands: state.brands,
        minPrice: state.minPrice,
        maxPrice: state.maxPrice,
        inStock: state.inStock,
        deals: state.deals,
        sort: state.sort,
        page: state.page,
      });
    } catch {
      error = true;
    }
  }

  const categoryOptions = flattenCategoryTree(
    pruneEmptyCategories(
      buildCategoryTree(categories),
      categoryCountMap(categories),
    ),
  ).map((category) => ({
    slug: category.slug,
    name: categoryOptionLabel(category),
  }));
  const brandOptions = brands
    .filter((brand) => (brand._count?.products ?? 0) > 0)
    .map((brand) => ({ slug: brand.slug, name: brand.name }));

  const heading = headingFor(mode, state, fixedCategory);

  return (
    <CatalogExperience
      pathname={pathname}
      state={state}
      fixedCategory={fixedCategory?.slug}
      title={heading.title}
      eyebrow={heading.eyebrow}
      description={heading.description}
      breadcrumbs={heading.breadcrumbs}
      subcategories={fixedCategory?.children ?? []}
      categories={categoryOptions}
      brands={brandOptions}
      showCategories
      products={listing.items}
      total={listing.total}
      totalPages={listing.totalPages}
      error={error}
      emptyQuery={emptyQuery}
    />
  );
}

function headingFor(
  mode: CatalogPageProps["mode"],
  state: CatalogState,
  category?: CategoryWithMeta,
) {
  if (mode === "search") {
    return {
      eyebrow: "Search",
      title: state.q ? `Results for “${state.q}”` : "Search",
      description: state.q
        ? "Products matching your search, with the same filters as the catalog."
        : undefined,
      breadcrumbs: [
        { href: "/", label: "Home" },
        { href: "/search", label: "Search" },
      ],
    };
  }

  if (mode === "category" && category) {
    const breadcrumbs = [{ href: "/", label: "Home" }];
    if (category.parent) {
      breadcrumbs.push({
        href: `/categories/${category.parent.slug}`,
        label: category.parent.name,
      });
    }
    breadcrumbs.push({
      href: `/categories/${category.slug}`,
      label: category.name,
    });
    return {
      eyebrow: "Category",
      title: category.name,
      description: category.description ?? undefined,
      breadcrumbs,
    };
  }

  const title = state.deals
    ? "Deals"
    : state.sort === "newest"
      ? "New arrivals"
      : "All products";

  return {
    eyebrow: "Catalog",
    title,
    description: "Browse the live AstraBazaar catalog.",
    breadcrumbs: [
      { href: "/", label: "Home" },
      { href: "/products", label: "Products" },
    ],
  };
}
