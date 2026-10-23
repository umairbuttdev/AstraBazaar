import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  type ListProductsQuery,
  type ProductSort,
} from './list-products.query.js';
import { serializeProduct } from './product.serializer.js';
import { categoryIdsInTree } from './category-ids.js';

const productInclude = {
  category: true,
  brand: true,
  images: {
    orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
  },
  variants: {
    include: {
      inventory: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.ProductInclude;

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, '\\$&');
}

function intersectIds(current: string[] | undefined, next: string[]) {
  if (!current) {
    return next;
  }
  const allowed = new Set(current);
  return next.filter((id) => allowed.has(id));
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListProductsQuery) {
    const where = await this.buildWhere(query);
    const total = await this.prisma.product.count({ where });
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

    const products = await this.loadPage(where, query);

    return {
      items: products.map((product) => serializeProduct(product)),
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          include: { parent: true },
        },
        brand: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        variants: {
          include: {
            inventory: true,
            images: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product "${slug}" not found`);
    }

    return serializeProduct(product);
  }

  private async buildWhere(
    query: ListProductsQuery,
  ): Promise<Prisma.ProductWhereInput> {
    const where: Prisma.ProductWhereInput = {
      status: query.status ?? ProductStatus.ACTIVE,
    };

    if (query.category) {
      const rows = await this.prisma.category.findMany({
        select: { id: true, slug: true, parentId: true },
      });
      const category = rows.find((row) => row.slug === query.category);
      where.categoryId = {
        in: category
          ? categoryIdsInTree(
              rows.map((row) => ({ id: row.id, parentId: row.parentId })),
              category.id,
            )
          : [],
      };
    }

    if (query.brands.length > 0) {
      where.brand = { slug: { in: query.brands } };
    }

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { brand: { name: { contains: query.q, mode: 'insensitive' } } },
        { category: { name: { contains: query.q, mode: 'insensitive' } } },
        {
          variants: {
            some: { sku: { contains: query.q, mode: 'insensitive' } },
          },
        },
      ];
    }

    const variant: Prisma.ProductVariantWhereInput = { isDefault: true };
    let needsVariant = false;

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      variant.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
      needsVariant = true;
    }

    if (needsVariant) {
      where.variants = { some: variant };
    }

    let ids: string[] | undefined;

    if (query.inStock) {
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT p.id
        FROM products p
        INNER JOIN product_variants v
          ON v."productId" = p.id AND v."isDefault" = true
        INNER JOIN inventory i ON i."variantId" = v.id
        WHERE (i.quantity - i.reserved) > 0
      `;
      ids = intersectIds(ids, rows.map((row) => row.id));
    }

    if (query.deals) {
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT p.id
        FROM products p
        INNER JOIN product_variants v
          ON v."productId" = p.id AND v."isDefault" = true
        WHERE v."compareAtPrice" IS NOT NULL
          AND v."compareAtPrice" > v.price
      `;
      ids = intersectIds(ids, rows.map((row) => row.id));
    }

    if (ids) {
      where.id = { in: ids };
    }

    return where;
  }

  private async loadPage(
    where: Prisma.ProductWhereInput,
    query: ListProductsQuery,
  ) {
    if (
      query.sort === 'price_asc' ||
      query.sort === 'price_desc' ||
      query.sort === 'relevance'
    ) {
      const ids = await this.orderedIds(where, query.sort, query);
      return this.loadByIds(ids);
    }

    return this.prisma.product.findMany({
      where,
      orderBy:
        query.sort === 'name' ? { name: 'asc' } : { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: productInclude,
    });
  }

  private async orderedIds(
    where: Prisma.ProductWhereInput,
    sort: ProductSort,
    query: ListProductsQuery,
  ) {
    const matched = await this.prisma.product.findMany({
      where,
      select: { id: true },
    });
    if (matched.length === 0) {
      return [];
    }

    const ids = matched.map((product) => product.id);
    const offset = (query.page - 1) * query.limit;

    if (sort === 'price_asc' || sort === 'price_desc') {
      const direction =
        sort === 'price_asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT p.id
        FROM products p
        LEFT JOIN product_variants v
          ON v."productId" = p.id AND v."isDefault" = true
        WHERE p.id IN (${Prisma.join(ids)})
        ORDER BY v.price ${direction} NULLS LAST, p.name ASC
        LIMIT ${query.limit} OFFSET ${offset}
      `;
      return rows.map((row) => row.id);
    }

    const term = escapeLike(query.q ?? '');
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT p.id
      FROM products p
      WHERE p.id IN (${Prisma.join(ids)})
      ORDER BY
        CASE
          WHEN p.name ILIKE ${`${term}%`} ESCAPE '\\' THEN 0
          WHEN p.name ILIKE ${`%${term}%`} ESCAPE '\\' THEN 1
          ELSE 2
        END,
        p."createdAt" DESC
      LIMIT ${query.limit} OFFSET ${offset}
    `;
    return rows.map((row) => row.id);
  }

  private async loadByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: productInclude,
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    return ids.flatMap((id) => {
      const product = byId.get(id);
      return product ? [product] : [];
    });
  }
}
