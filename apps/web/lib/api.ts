import { cacheLife, cacheTag } from "next/cache";
import type { CatalogSort } from "./catalog";
import {
  getDefaultVariant,
  getDiscountPercent,
  getPrimaryImage,
} from "./product-pricing";
import type { Brand, Category, Product } from "./types";

export { getDefaultVariant, getDiscountPercent, getPrimaryImage };

export type CategoryWithMeta = Category & {
  parentId?: string | null;
  parent?: Category | null;
  children?: Category[];
  _count?: { products: number };
};

export type ProductListResult = {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductListQuery = {
  q?: string;
  category?: string;
  brands?: string[];
  minPrice?: string;
  maxPrice?: string;
  inStock?: boolean;
  deals?: boolean;
  sort?: CatalogSort;
  page?: number;
  limit?: number;
};

export type BrandWithMeta = Brand & {
  logoUrl?: string | null;
  _count?: { products: number };
};

function getApiBaseUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:3001"
  );
}

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`);

  if (!response.ok) {
    throw new Error(`API ${path} failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getProductListing(filters: ProductListQuery = {}) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
    cacheTag(`products:q:${filters.q}`);
  }
  if (filters.category) {
    params.set("category", filters.category);
    cacheTag(`products:category:${filters.category}`);
  }
  for (const brand of filters.brands ?? []) {
    params.append("brand", brand);
    cacheTag(`products:brand:${brand}`);
  }
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.inStock) params.set("inStock", "1");
  if (filters.deals) params.set("deals", "1");
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  return apiFetch<ProductListResult>(`/products${query ? `?${query}` : ""}`);
}

export async function getProducts(filters?: {
  category?: string;
  brand?: string;
  limit?: number;
  sort?: CatalogSort;
}) {
  const listing = await getProductListing({
    category: filters?.category,
    brands: filters?.brand ? [filters.brand] : undefined,
    limit: filters?.limit ?? 24,
    sort: filters?.sort,
    page: 1,
  });
  return listing.items;
}

export async function getAllProductSlugs() {
  const slugs: string[] = [];
  let page = 1;

  while (page <= 20) {
    const listing = await getProductListing({ page, limit: 48, sort: "name" });
    slugs.push(...listing.items.map((product) => product.slug));
    if (listing.items.length === 0 || page >= listing.totalPages) {
      break;
    }
    page += 1;
  }

  return slugs;
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  cacheTag(`product:${slug}`);
  return apiFetch<Product>(`/products/${slug}`);
}

export async function getCategories() {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories");
  return apiFetch<CategoryWithMeta[]>("/categories");
}

export async function getCategoryBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories");
  cacheTag(`category:${slug}`);
  return apiFetch<CategoryWithMeta>(`/categories/${slug}`);
}

export async function getBrands() {
  "use cache";
  cacheLife("minutes");
  cacheTag("brands");
  return apiFetch<BrandWithMeta[]>("/brands");
}
