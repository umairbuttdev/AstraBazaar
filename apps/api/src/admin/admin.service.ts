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
import { serializeOrder } from '../checkout/order.serializer.js';
import { serializeProduct } from '../products/product.serializer.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type AdminCreateProductInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  status?: ProductStatus;
  categoryId?: string | null;
  brandId?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  variant?: {
    sku?: string;
    name?: string | null;
    price?: string | number;
    compareAtPrice?: string | number | null;
    quantity?: number;
  };
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
        include: { inventory: true },
        orderBy: { createdAt: 'asc' as const },
      },
    };
  }

  private orderInclude() {
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
    };
  }

  async listProducts() {
    const products = await this.prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
      include: this.productInclude(),
    });
    return products.map((product) => serializeProduct(product));
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
    const sku = input.variant?.sku?.trim() ?? '';
    const price = Number(input.variant?.price);
    const quantity = input.variant?.quantity ?? 0;

    if (!name || !slug) {
      throw new BadRequestException('name and slug are required');
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BadRequestException(
        'slug must be lowercase letters, numbers, and hyphens only (e.g. astra-runner-02)',
      );
    }
    if (!sku) {
      throw new BadRequestException('variant.sku is required');
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException('variant.price must be a non-negative number');
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new BadRequestException('variant.quantity must be a non-negative integer');
    }

    const compareAt =
      input.variant?.compareAtPrice === undefined ||
      input.variant?.compareAtPrice === null ||
      input.variant?.compareAtPrice === ''
        ? null
        : Number(input.variant.compareAtPrice);

    if (compareAt !== null && (!Number.isFinite(compareAt) || compareAt < 0)) {
      throw new BadRequestException('variant.compareAtPrice is invalid');
    }

    try {
      const product = await this.prisma.product.create({
        data: {
          name,
          slug,
          description: input.description?.trim() || null,
          status: input.status ?? ProductStatus.DRAFT,
          categoryId: input.categoryId || null,
          brandId: input.brandId || null,
          images: input.imageUrl?.trim()
            ? {
                create: [
                  {
                    url: input.imageUrl.trim(),
                    alt: input.imageAlt?.trim() || name,
                    isPrimary: true,
                    sortOrder: 0,
                  },
                ],
              }
            : undefined,
          variants: {
            create: [
              {
                sku,
                name: input.variant?.name?.trim() || null,
                price,
                compareAtPrice: compareAt,
                isDefault: true,
                inventory: {
                  create: {
                    quantity,
                    reserved: 0,
                  },
                },
              },
            ],
          },
        },
        include: this.productInclude(),
      });

      return serializeProduct(product);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Product slug or variant SKU already exists');
      }
      throw error;
    }
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
      const imageUrl = input.imageUrl?.trim();

      if (imageUrl) {
        const primary = await this.prisma.productImage.findFirst({
          where: { productId: id, isPrimary: true },
          orderBy: { sortOrder: 'asc' },
        });

        if (primary) {
          await this.prisma.productImage.update({
            where: { id: primary.id },
            data: {
              url: imageUrl,
              alt: input.imageAlt?.trim() || existing.name,
            },
          });
        } else {
          await this.prisma.productImage.create({
            data: {
              productId: id,
              url: imageUrl,
              alt: input.imageAlt?.trim() || existing.name,
              isPrimary: true,
              sortOrder: 0,
            },
          });
        }
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

  async listInventory() {
    const rows = await this.prisma.inventory.findMany({
      orderBy: { updatedAt: 'desc' },
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

    return rows.map((row) => ({
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

  async listOrders() {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.orderInclude(),
    });

    return orders.map((order) =>
      serializeOrder(order as unknown as Record<string, unknown>),
    );
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude(),
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

    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: this.orderInclude(),
    });

    return serializeOrder(order as unknown as Record<string, unknown>);
  }

  async listCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }

  async listBrands() {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }
}
