import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  Prisma,
  ProductStatus,
} from '@prisma/client';
import { canCancelOrder } from '../checkout/checkout.rules.js';
import { serializeOrder } from '../checkout/order.serializer.js';
import { serializeProduct } from '../products/product.serializer.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  normalizeAdminVariants,
  type AdminVariantInput,
} from './variant.input.js';
import { catalogSlug } from './catalog-name.js';
import { expandPackedVariants } from './expand-packed-variants.js';
import { readAdminImages, type AdminImageInput } from './product-images.js';

export type { AdminVariantInput };

export type AdminCreateProductInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  status?: ProductStatus;
  categoryId?: string | null;
  brandId?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  images?: AdminImageInput[];
  variant?: AdminVariantInput;
  variants?: AdminVariantInput[];
};

export type AdminUpdateProductInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  status?: ProductStatus;
  categoryId?: string | null;
  brandId?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  images?: AdminImageInput[];
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private productInclude() {
    return {
      category: true,
      brand: true,
      images: {
        orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
      },
      variants: {
        include: {
          inventory: true,
          images: { orderBy: { sortOrder: 'asc' as const } },
        },
        orderBy: { createdAt: 'asc' as const },
      },
    };
  }

  private orderInclude(detail = false) {
    return {
      items: {
        orderBy: { createdAt: 'asc' as const },
      },
      profile: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
      ...(detail
        ? { statusHistory: { orderBy: { createdAt: 'asc' as const } } }
        : {}),
    };
  }

  private pageArgs(query: { page?: string; limit?: string }, fallback = 20) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || fallback));
    return { page, limit, skip: (page - 1) * limit };
  }

  private pageResult<T>(items: T[], total: number, page: number, limit: number) {
    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async listProducts(query: {
    page?: string;
    limit?: string;
    status?: string;
    categoryId?: string;
    brandId?: string;
    q?: string;
  } = {}) {
    const { page, limit, skip } = this.pageArgs(query);
    const q = query.q?.trim();
    const status = Object.values(ProductStatus).includes(query.status as ProductStatus)
      ? (query.status as ProductStatus)
      : undefined;
    const where: Prisma.ProductWhereInput = {
      ...(status ? { status } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.brandId ? { brandId: query.brandId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
              { variants: { some: { sku: { contains: q, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: this.productInclude(),
      }),
      this.prisma.product.count({ where }),
    ]);

    return this.pageResult(
      products.map((product) => serializeProduct(product)),
      total,
      page,
      limit,
    );
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: this.productInclude(),
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return serializeProduct(product);
  }

  async createProduct(input: AdminCreateProductInput) {
    const name = input.name?.trim() ?? '';
    const slug = input.slug?.trim() ?? '';

    if (!name || !slug) {
      throw new BadRequestException('name and slug are required');
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BadRequestException(
        'slug must be lowercase letters, numbers, and hyphens only (e.g. astra-runner-02)',
      );
    }

    const gallery = readAdminImages(
      input.images?.length
        ? input.images
        : input.imageUrl?.trim()
          ? [{ url: input.imageUrl, alt: input.imageAlt }]
          : [],
      'A product',
    );
    const sourceVariants = input.variants?.length
      ? input.variants
      : input.variant
        ? [input.variant]
        : [];

    console.info('[admin.createProduct] incoming', {
      name,
      slug,
      sourceVariantCount: sourceVariants.length,
      sourceVariants: sourceVariants.map((variant, index) => ({
        index,
        sku: variant.sku,
        price: variant.price,
        quantity: variant.quantity,
        attributes: variant.attributes,
        imageCount: variant.images?.length ?? 0,
      })),
    });

    let variants;
    try {
      variants = normalizeAdminVariants(sourceVariants);
    } catch (error) {
      console.error('[admin.createProduct] normalize failed', {
        sourceVariantCount: sourceVariants.length,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }

    console.info('[admin.createProduct] normalized', {
      expandedCount: variants.length,
      skus: variants.map((variant) => variant.sku),
      attributes: variants.map((variant) => variant.attributes),
    });

    const variantImages = sourceVariants.map((variant) =>
      readAdminImages(variant.images, `Variant ${variant.sku?.trim() || ''}`.trim()),
    );

    try {
      // Create variants first, then inventory in a second step. Nested
      // `inventory: { create }` under several variants races with the pg
      // driver adapter and fails with inventory_variantId_fkey.
      const productId = await this.prisma.$transaction(
        async (tx) => {
          const product = await tx.product.create({
            data: {
              name,
              slug,
              description: input.description?.trim() || null,
              status: input.status ?? ProductStatus.DRAFT,
              categoryId: input.categoryId || null,
              brandId: input.brandId || null,
              images: gallery.length
                ? {
                    create: gallery.map((image, index) => ({
                      url: image.url,
                      alt: image.alt || name,
                      isPrimary: index === 0,
                      sortOrder: index,
                    })),
                  }
                : undefined,
              variants: {
                create: variants.map((variant) => ({
                  sku: variant.sku,
                  name: variant.name,
                  price: variant.price,
                  compareAtPrice: variant.compareAtPrice,
                  attributes: variant.attributes,
                  isDefault: variant.isDefault,
                })),
              },
            },
            include: { variants: { select: { id: true, sku: true } } },
          });

          const inventoryRows = variants.map((variant) => {
            const created = product.variants.find((row) => row.sku === variant.sku);
            if (!created) {
              throw new BadRequestException(
                `Could not create stock row for ${variant.sku}`,
              );
            }
            return {
              variantId: created.id,
              quantity: variant.quantity,
              reserved: 0,
            };
          });
          if (inventoryRows.length > 0) {
            await tx.inventory.createMany({ data: inventoryRows });
          }

          const variantImageRows = variants.flatMap((variant) => {
            const created = product.variants.find((row) => row.sku === variant.sku);
            if (!created) return [];
            return (variantImages[variant.sourceIndex] ?? []).map(
              (image, imageIndex) => ({
                productId: product.id,
                variantId: created.id,
                url: image.url,
                alt: image.alt || variant.name || name,
                sortOrder: imageIndex,
                isPrimary: false,
              }),
            );
          });

          if (variantImageRows.length > 0) {
            await tx.productImage.createMany({ data: variantImageRows });
          }

          return product.id;
        },
        { timeout: 20_000 },
      );

      return this.getProduct(productId);
    } catch (error) {
      console.error('[admin.createProduct] persist failed', {
        slug,
        expandedCount: variants.length,
        skus: variants.map((variant) => variant.sku),
        code:
          error instanceof Prisma.PrismaClientKnownRequestError
            ? error.code
            : undefined,
        message: error instanceof Error ? error.message : error,
        meta:
          error instanceof Prisma.PrismaClientKnownRequestError
            ? error.meta
            : undefined,
      });
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Product slug or variant SKU already exists');
      }
      throw error;
    }
  }

  async addVariant(productId: string, input: AdminVariantInput) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { variants: { select: { attributes: true } } },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    console.info('[admin.addVariant] incoming', {
      productId,
      existingCount: product.variants.length,
      sku: input.sku,
      price: input.price,
      quantity: input.quantity,
      attributes: input.attributes,
      imageCount: input.images?.length ?? 0,
    });

    let variants;
    try {
      variants = normalizeAdminVariants([input], { defaultFirst: false });
    } catch (error) {
      console.error('[admin.addVariant] normalize failed', {
        productId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }

    console.info('[admin.addVariant] normalized', {
      productId,
      expandedCount: variants.length,
      skus: variants.map((variant) => variant.sku),
    });

    if (variants.length === 0) {
      throw new BadRequestException('A variant is required');
    }
    if (product.variants.length + variants.length > 30) {
      throw new BadRequestException(
        `Adding these sizes would exceed 30 versions on this product.`,
      );
    }

    const images = readAdminImages(input.images, 'A variant');
    const existingKeys = [
      ...new Set(
        product.variants.flatMap((row) => {
          if (
            !row.attributes ||
            typeof row.attributes !== 'object' ||
            Array.isArray(row.attributes)
          ) {
            return [];
          }
          return Object.keys(row.attributes);
        }),
      ),
    ].sort();
    const sample = variants[0]!;
    const nextKeys =
      sample.attributes &&
      typeof sample.attributes === 'object' &&
      !Array.isArray(sample.attributes) &&
      sample.attributes !== Prisma.JsonNull
        ? Object.keys(sample.attributes as Record<string, unknown>).sort()
        : [];
    if (existingKeys.length > 0) {
      if (
        nextKeys.length !== existingKeys.length ||
        nextKeys.some((key, index) => key !== existingKeys[index])
      ) {
        throw new BadRequestException(
          `This product uses these customer choices: ${existingKeys.join(', ')}. Add the same labels with a value for each.`,
        );
      }
    }

    try {
      await this.prisma.$transaction(
        async (tx) => {
          for (const [index, variant] of variants.entries()) {
            const created = await tx.productVariant.create({
              data: {
                productId,
                sku: variant.sku,
                name: variant.name,
                price: variant.price,
                compareAtPrice: variant.compareAtPrice,
                attributes: variant.attributes,
                isDefault: product.variants.length === 0 && index === 0,
              },
            });

            await tx.inventory.create({
              data: {
                variantId: created.id,
                quantity: variant.quantity,
                reserved: 0,
              },
            });

            if (images.length > 0) {
              await tx.productImage.createMany({
                data: images.map((image, imageIndex) => ({
                  productId,
                  variantId: created.id,
                  url: image.url,
                  alt: image.alt || variant.name || product.name,
                  sortOrder: imageIndex,
                  isPrimary: false,
                })),
              });
            }
          }
        },
        { timeout: 20_000 },
      );
    } catch (error) {
      console.error('[admin.addVariant] persist failed', {
        productId,
        expandedCount: variants.length,
        skus: variants.map((variant) => variant.sku),
        code:
          error instanceof Prisma.PrismaClientKnownRequestError
            ? error.code
            : undefined,
        message: error instanceof Error ? error.message : error,
        meta:
          error instanceof Prisma.PrismaClientKnownRequestError
            ? error.meta
            : undefined,
      });
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('That SKU already exists');
      }
      throw error;
    }

    return this.getProduct(productId);
  }

  async expandPackedOptions(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            inventory: true,
            images: { orderBy: { sortOrder: 'asc' } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const drafts = expandPackedVariants(
      product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        attributes:
          variant.attributes &&
          typeof variant.attributes === 'object' &&
          !Array.isArray(variant.attributes)
            ? Object.fromEntries(
                Object.entries(variant.attributes as Record<string, unknown>).map(
                  ([key, value]) => [key, String(value)],
                ),
              )
            : null,
        quantity: variant.inventory?.quantity ?? 0,
        reserved: variant.inventory?.reserved ?? 0,
        imageUrls: variant.images.map((image) => ({
          url: image.url,
          alt: image.alt,
          sortOrder: image.sortOrder,
        })),
      })),
    );

    if (!drafts) {
      throw new BadRequestException(
        'This product already uses one value per choice. Nothing to expand.',
      );
    }
    if (drafts.length > 30) {
      throw new BadRequestException(
        `Expanding would create ${drafts.length} versions. A product can have at most 30.`,
      );
    }

    const seen = new Set<string>();
    for (const draft of drafts) {
      let sku = draft.sku;
      let suffix = 2;
      while (seen.has(sku.toLowerCase())) {
        sku = `${draft.sku}-${suffix}`.slice(0, 60);
        suffix += 1;
      }
      seen.add(sku.toLowerCase());
      draft.sku = sku;
    }

    await this.prisma.$transaction(
      async (tx) => {
      const variantIds = product.variants.map((variant) => variant.id);
      await tx.cartItem.deleteMany({ where: { variantId: { in: variantIds } } });
      await tx.inventory.deleteMany({ where: { variantId: { in: variantIds } } });
      await tx.productImage.deleteMany({
        where: { productId, variantId: { not: null } },
      });
      await tx.productVariant.deleteMany({ where: { productId } });

      for (const draft of drafts) {
        const created = await tx.productVariant.create({
          data: {
            productId,
            sku: draft.sku,
            name: draft.name,
            price: draft.price,
            compareAtPrice: draft.compareAtPrice,
            attributes: draft.attributes,
            isDefault: draft.isDefault,
          },
        });
        await tx.inventory.create({
          data: {
            variantId: created.id,
            quantity: draft.quantity,
            reserved: draft.reserved,
          },
        });
        if (draft.imageUrls.length > 0) {
          await tx.productImage.createMany({
            data: draft.imageUrls.map((image, index) => ({
              productId,
              variantId: created.id,
              url: image.url,
              alt: image.alt,
              sortOrder: image.sortOrder ?? index,
              isPrimary: false,
            })),
          });
        }
      }
    },
      { timeout: 60000 },
    );

    return this.getProduct(productId);
  }

  async updateProduct(id: string, input: AdminUpdateProductInput) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    if (input.status && !Object.values(ProductStatus).includes(input.status)) {
      throw new BadRequestException('Invalid product status');
    }

    try {
      const incoming = readAdminImages(
        [
          ...(input.imageUrl?.trim()
            ? [{ url: input.imageUrl, alt: input.imageAlt }]
            : []),
          ...(input.images ?? []),
        ],
        'A product',
      );

      if (incoming.length > 0) {
        const current = await this.prisma.productImage.findMany({
          where: { productId: id, variantId: null },
          select: { sortOrder: true },
        });
        if (current.length + incoming.length > 8) {
          throw new BadRequestException('A product can include at most 8 images');
        }
        const start =
          current.reduce((max, image) => Math.max(max, image.sortOrder), -1) + 1;
        await this.prisma.productImage.createMany({
          data: incoming.map((image, index) => ({
            productId: id,
            url: image.url,
            alt: image.alt || existing.name,
            sortOrder: start + index,
            isPrimary: current.length === 0 && index === 0,
          })),
        });
      }

      const product = await this.prisma.product.update({
        where: { id },
        data: {
          name: input.name?.trim() || undefined,
          slug: input.slug?.trim() || undefined,
          description:
            input.description === undefined
              ? undefined
              : input.description?.trim() || null,
          status: input.status,
          categoryId:
            input.categoryId === undefined ? undefined : input.categoryId || null,
          brandId: input.brandId === undefined ? undefined : input.brandId || null,
        },
        include: this.productInclude(),
      });
      return serializeProduct(product);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Product slug already exists');
      }
      throw error;
    }
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: { select: { id: true } } },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variantIds = product.variants.map((variant) => variant.id);

    await this.prisma.$transaction(async (tx) => {
      if (variantIds.length > 0) {
        // Past orders keep productName/sku snapshots; variant links become null.
        await tx.orderItem.updateMany({
          where: { variantId: { in: variantIds } },
          data: { variantId: null },
        });
        await tx.cartItem.deleteMany({ where: { variantId: { in: variantIds } } });
        await tx.inventory.deleteMany({ where: { variantId: { in: variantIds } } });
      }
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.wishlistItem.deleteMany({ where: { productId: id } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    return { ok: true, id };
  }

  async updateVariant(
    productId: string,
    variantId: string,
    input: AdminVariantInput & { isDefault?: boolean },
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          select: { id: true, attributes: true },
        },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const existing = product.variants.find((variant) => variant.id === variantId);
    if (!existing) {
      throw new NotFoundException('Variant not found');
    }

    const [normalized] = normalizeAdminVariants([input], {
      defaultFirst: false,
      allowPacked: false,
    });
    if (!normalized) {
      throw new BadRequestException('A variant is required');
    }

    const existingKeys = [
      ...new Set(
        product.variants.flatMap((row) => {
          if (
            !row.attributes ||
            typeof row.attributes !== 'object' ||
            Array.isArray(row.attributes)
          ) {
            return [];
          }
          return Object.keys(row.attributes);
        }),
      ),
    ].sort();
    const nextKeys =
      normalized.attributes &&
      typeof normalized.attributes === 'object' &&
      !Array.isArray(normalized.attributes) &&
      normalized.attributes !== Prisma.JsonNull
        ? Object.keys(normalized.attributes as Record<string, unknown>).sort()
        : [];
    if (existingKeys.length > 0) {
      if (
        nextKeys.length !== existingKeys.length ||
        nextKeys.some((key, index) => key !== existingKeys[index])
      ) {
        throw new BadRequestException(
          `This product uses these customer choices: ${existingKeys.join(', ')}. Keep the same labels.`,
        );
      }
    }

    const images = readAdminImages(input.images, 'A variant');

    try {
      await this.prisma.$transaction(async (tx) => {
        if (input.isDefault) {
          await tx.productVariant.updateMany({
            where: { productId },
            data: { isDefault: false },
          });
        }

        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            sku: normalized.sku,
            name: normalized.name,
            price: normalized.price,
            compareAtPrice: normalized.compareAtPrice,
            attributes: normalized.attributes,
            ...(input.isDefault ? { isDefault: true } : {}),
          },
        });

        await tx.inventory.upsert({
          where: { variantId },
          create: {
            variantId,
            quantity: normalized.quantity,
            reserved: 0,
          },
          update: {
            quantity: normalized.quantity,
          },
        });

        if (images.length > 0) {
          const current = await tx.productImage.count({
            where: { variantId },
          });
          if (current + images.length > 8) {
            throw new BadRequestException('A variant can include at most 8 images');
          }
          const start = current;
          await tx.productImage.createMany({
            data: images.map((image, index) => ({
              productId,
              variantId,
              url: image.url,
              alt: image.alt || normalized.name || product.name,
              sortOrder: start + index,
              isPrimary: false,
            })),
          });
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('That SKU already exists');
      }
      throw error;
    }

    return this.getProduct(productId);
  }

  async deleteVariant(productId: string, variantId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          select: { id: true, isDefault: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const variant = product.variants.find((item) => item.id === variantId);
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }
    if (product.variants.length <= 1) {
      throw new BadRequestException(
        'A product needs at least one version. Delete the whole product instead.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.orderItem.updateMany({
        where: { variantId },
        data: { variantId: null },
      });
      await tx.cartItem.deleteMany({ where: { variantId } });
      await tx.inventory.deleteMany({ where: { variantId } });
      await tx.productImage.deleteMany({ where: { variantId } });
      await tx.productVariant.delete({ where: { id: variantId } });

      if (variant.isDefault) {
        const next = product.variants.find((item) => item.id !== variantId);
        if (next) {
          await tx.productVariant.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return this.getProduct(productId);
  }

  async listInventory(query: {
    page?: string;
    limit?: string;
    q?: string;
    stock?: string;
  } = {}) {
    const { page, limit, skip } = this.pageArgs(query);
    const q = query.q?.trim();
    const filters: Prisma.Sql[] = [Prisma.sql`TRUE`];
    if (query.stock === 'out') {
      filters.push(Prisma.sql`(i.quantity - i.reserved) <= 0`);
    } else if (query.stock === 'low') {
      filters.push(
        Prisma.sql`(i.quantity - i.reserved) > 0 AND (i.quantity - i.reserved) <= 5`,
      );
    }
    if (q) {
      const like = `%${q}%`;
      filters.push(
        Prisma.sql`(v.sku ILIKE ${like} OR COALESCE(v.name, '') ILIKE ${like} OR p.name ILIKE ${like})`,
      );
    }
    const where = Prisma.join(filters, ' AND ');
    const idRows = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT i.id
      FROM inventory i
      INNER JOIN product_variants v ON v.id = i."variantId"
      INNER JOIN products p ON p.id = v."productId"
      WHERE ${where}
      ORDER BY i."updatedAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `);
    const countRows = await this.prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM inventory i
      INNER JOIN product_variants v ON v.id = i."variantId"
      INNER JOIN products p ON p.id = v."productId"
      WHERE ${where}
    `);
    const ids = idRows.map((row) => row.id);
    const rows = ids.length
      ? await this.prisma.inventory.findMany({
          where: { id: { in: ids } },
          include: {
            variant: {
              include: {
                product: {
                  select: { id: true, name: true, slug: true, status: true },
                },
              },
            },
          },
        })
      : [];
    const byId = new Map(rows.map((row) => [row.id, row]));
    const items = ids
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .map((row) => ({
        id: row.id,
        variantId: row.variantId,
        quantity: row.quantity,
        reserved: row.reserved,
        available: row.quantity - row.reserved,
        updatedAt: row.updatedAt,
        sku: row.variant.sku,
        variantName: row.variant.name,
        product: row.variant.product,
      }));

    return this.pageResult(items, Number(countRows[0]?.count ?? 0), page, limit);
  }

  async updateInventory(variantId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new BadRequestException('quantity must be a non-negative integer');
    }

    const inventory = await this.prisma.inventory.findUnique({
      where: { variantId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found for variant');
    }

    if (quantity < inventory.reserved) {
      throw new BadRequestException(
        `quantity cannot be less than reserved (${inventory.reserved})`,
      );
    }

    const updated = await this.prisma.inventory.update({
      where: { variantId },
      data: { quantity },
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return {
      id: updated.id,
      variantId: updated.variantId,
      quantity: updated.quantity,
      reserved: updated.reserved,
      available: updated.quantity - updated.reserved,
      updatedAt: updated.updatedAt,
      sku: updated.variant.sku,
      variantName: updated.variant.name,
      product: updated.variant.product,
    };
  }

  async listOrders(query: {
    page?: string;
    limit?: string;
    status?: string;
    paymentStatus?: string;
    q?: string;
  } = {}) {
    const { page, limit, skip } = this.pageArgs(query);
    const q = query.q?.trim();
    const open = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] as const;
    const status = Object.values(OrderStatus).includes(query.status as OrderStatus)
      ? (query.status as OrderStatus)
      : undefined;
    const paymentStatus = ['UNPAID', 'PENDING', 'PAID', 'FAILED'].includes(
      query.paymentStatus ?? '',
    )
      ? (query.paymentStatus as 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED')
      : undefined;
    const where: Prisma.OrderWhereInput = {
      ...(query.status === 'open'
        ? { status: { in: [...open] } }
        : status
          ? { status }
          : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { fullName: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: this.orderInclude(),
      }),
      this.prisma.order.count({ where }),
    ]);

    return this.pageResult(
      orders.map((order) =>
        serializeOrder(order as unknown as Record<string, unknown>),
      ),
      total,
      page,
      limit,
    );
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude(true),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return serializeOrder(order as unknown as Record<string, unknown>);
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    if (!Object.values(OrderStatus).includes(status)) {
      throw new BadRequestException('Invalid order status');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${id} FOR UPDATE`;
      const existing = await tx.order.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Order not found');
      }

      if (
        existing.status !== status &&
        status === OrderStatus.CANCELLED &&
        canCancelOrder(existing.status)
      ) {
        const items = await tx.orderItem.findMany({
          where: { orderId: id },
          select: { variantId: true, quantity: true },
        });
        for (const item of items) {
          if (!item.variantId) continue;
          await tx.inventory.updateMany({
            where: { variantId: item.variantId },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }

      await tx.order.update({
        where: { id },
        data: { status },
      });
      if (existing.status !== status) {
        await tx.orderStatusHistory.create({
          data: { orderId: id, status },
        });
      }
      return tx.order.findUniqueOrThrow({
        where: { id },
        include: this.orderInclude(true),
      });
    });

    return serializeOrder(order as unknown as Record<string, unknown>);
  }

  async deleteOrder(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${id} FOR UPDATE`;
      const existing = await tx.order.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Order not found');
      }

      if (canCancelOrder(existing.status)) {
        const items = await tx.orderItem.findMany({
          where: { orderId: id },
          select: { variantId: true, quantity: true },
        });
        for (const item of items) {
          if (!item.variantId) continue;
          await tx.inventory.updateMany({
            where: { variantId: item.variantId },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }

      await tx.orderStatusHistory.deleteMany({ where: { orderId: id } });
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
      return { ok: true, id };
    });
  }

  async listCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        _count: { select: { products: true, children: true } },
      },
    });
  }

  async listBrands() {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: { select: { products: true } },
      },
    });
  }

  async createCategory(input: {
    name?: string;
    description?: string | null;
    parentId?: string | null;
  }) {
    const name = input.name?.trim() ?? '';
    if (!name || name.length > 80) {
      throw new BadRequestException('Category name is required');
    }
    const parentId = input.parentId?.trim() || null;
    if (parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw new BadRequestException('Parent category was not found');
      }
    }

    try {
      return await this.prisma.category.create({
        data: {
          name,
          slug: catalogSlug(name),
          description: input.description?.trim() || null,
          parentId,
        },
        select: { id: true, name: true, slug: true, description: true, parentId: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('A category with that name already exists');
      }
      throw error;
    }
  }

  async createBrand(input: { name?: string; description?: string | null }) {
    const name = input.name?.trim() ?? '';
    if (!name || name.length > 80) {
      throw new BadRequestException('Brand name is required');
    }

    try {
      return await this.prisma.brand.create({
        data: {
          name,
          slug: catalogSlug(name),
          description: input.description?.trim() || null,
        },
        select: { id: true, name: true, slug: true, description: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('A brand with that name already exists');
      }
      throw error;
    }
  }

  private rangeStart(range?: string) {
    const now = new Date();
    if (range === 'today') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    if (range === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (range === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return null;
  }

  async dashboard(range?: string) {
    const from = this.rangeStart(range);
    const createdAt = from ? { gte: from } : undefined;
    const [orderValue, statusGroups, paymentFailed, recent, stockRows, productGroups] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: { status: { not: 'CANCELLED' }, ...(createdAt ? { createdAt } : {}) },
          _sum: { total: true },
          _count: { _all: true },
        }),
        this.prisma.order.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.order.count({ where: { paymentStatus: 'FAILED' } }),
        this.prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            total: true,
            currency: true,
            createdAt: true,
            fullName: true,
            email: true,
            paymentStatus: true,
            _count: { select: { items: true } },
          },
        }),
        this.prisma.$queryRaw<{ out: number; low: number }[]>(Prisma.sql`
          SELECT
            COUNT(*) FILTER (WHERE quantity - reserved <= 0)::int AS out,
            COUNT(*) FILTER (WHERE quantity - reserved > 0 AND quantity - reserved <= 5)::int AS low
          FROM inventory
        `),
        this.prisma.product.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
      ]);

    const byStatus = Object.fromEntries(
      statusGroups.map((row) => [row.status, row._count._all]),
    ) as Partial<Record<OrderStatus, number>>;
    const open =
      (byStatus.PENDING ?? 0) +
      (byStatus.CONFIRMED ?? 0) +
      (byStatus.PROCESSING ?? 0) +
      (byStatus.SHIPPED ?? 0);

    return {
      range: range === 'today' || range === '7d' || range === '30d' ? range : 'all',
      orderValue: Number(orderValue._sum.total ?? 0).toFixed(2),
      orderCount: orderValue._count._all,
      currency: 'USD',
      ordersByStatus: byStatus,
      openOrders: open,
      failedPayments: paymentFailed,
      lowStock: Number(stockRows[0]?.low ?? 0),
      outOfStock: Number(stockRows[0]?.out ?? 0),
      productsByStatus: Object.fromEntries(
        productGroups.map((row) => [row.status, row._count._all]),
      ),
      recentOrders: recent.map((order) => ({
        id: order.id,
        status: order.status,
        total: Number(order.total).toFixed(2),
        currency: order.currency,
        createdAt: order.createdAt,
        fullName: order.fullName,
        email: order.email,
        paymentStatus: order.paymentStatus,
        itemCount: order._count.items,
      })),
    };
  }

  async listCustomers(query: { page?: string; limit?: string; q?: string } = {}) {
    const { page, limit, skip } = this.pageArgs(query);
    const q = query.q?.trim();
    const where: Prisma.ProfileWhereInput = q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { fullName: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};
    const [customers, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.profile.count({ where }),
    ]);
    return this.pageResult(customers, total, page, limit);
  }

  async getCustomer(id: string) {
    const customer = await this.prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
          select: {
            id: true,
            label: true,
            fullName: true,
            line1: true,
            line2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            phone: true,
            isDefault: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            total: true,
            currency: true,
            createdAt: true,
            paymentStatus: true,
            paymentMethod: true,
            _count: { select: { items: true } },
          },
        },
        _count: { select: { orders: true } },
      },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return {
      ...customer,
      orders: customer.orders.map((order) => ({
        ...order,
        total: Number(order.total).toFixed(2),
        itemCount: order._count.items,
      })),
    };
  }
}
