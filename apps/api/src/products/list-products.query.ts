import { BadRequestException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';

export const PRODUCT_SORTS = [
  'relevance',
  'newest',
  'price_asc',
  'price_desc',
  'name',
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export type ListProductsQuery = {
  q?: string;
  category?: string;
  brands: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  deals: boolean;
  sort: ProductSort;
  page: number;
  limit: number;
  status: ProductStatus;
};

const SORTS = new Set<string>(PRODUCT_SORTS);
const STATUSES = new Set<string>(Object.values(ProductStatus));

function first(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return first(value[0]);
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function many(value: unknown): string[] {
  const source = Array.isArray(value) ? value : value === undefined ? [] : [value];
  const slugs = source.flatMap((entry) => String(entry).split(','));
  return [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))].slice(0, 8);
}

function optionalNumber(value: unknown, field: string): number | undefined {
  const raw = first(value);
  if (raw === undefined) {
    return undefined;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    throw new BadRequestException(`${field} must be a non-negative amount`);
  }
  const amount = Number(raw);
  if (amount > 1_000_000) {
    throw new BadRequestException(`${field} is too large`);
  }
  return amount;
}

function flag(value: unknown): boolean {
  const raw = first(value);
  return raw === '1' || raw === 'true';
}

export function parseListProductsQuery(
  query: Record<string, unknown>,
): ListProductsQuery {
  const q = first(query.q);
  if (q && q.length > 80) {
    throw new BadRequestException('Search query is too long');
  }

  const category = first(query.category);
  if (category && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(category)) {
    throw new BadRequestException('Invalid category');
  }

  const brands = many(query.brand);
  if (brands.some((slug) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug))) {
    throw new BadRequestException('Invalid brand');
  }

  const minPrice = optionalNumber(query.minPrice, 'minPrice');
  const maxPrice = optionalNumber(query.maxPrice, 'maxPrice');
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new BadRequestException('minPrice cannot be greater than maxPrice');
  }

  const sortRaw = first(query.sort);
  if (sortRaw && !SORTS.has(sortRaw)) {
    throw new BadRequestException('Invalid sort');
  }

  const pageRaw = first(query.page);
  const page = pageRaw ? Number(pageRaw) : 1;
  if (!Number.isInteger(page) || page < 1 || page > 10_000) {
    throw new BadRequestException('Invalid page');
  }

  const limitRaw = first(query.limit);
  const limit = limitRaw ? Number(limitRaw) : 12;
  if (!Number.isInteger(limit) || limit < 1 || limit > 48) {
    throw new BadRequestException('Invalid limit');
  }

  const statusRaw = first(query.status);
  if (statusRaw && !STATUSES.has(statusRaw)) {
    throw new BadRequestException('Invalid status');
  }

  const sort = (sortRaw as ProductSort | undefined) ?? (q ? 'relevance' : 'newest');

  return {
    q,
    category,
    brands,
    minPrice,
    maxPrice,
    inStock: flag(query.inStock),
    deals: flag(query.deals),
    sort: sort === 'relevance' && !q ? 'newest' : sort,
    page,
    limit,
    status: (statusRaw as ProductStatus | undefined) ?? ProductStatus.ACTIVE,
  };
}
