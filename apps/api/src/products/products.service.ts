import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeProduct } from './product.serializer.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    category?: string;
    brand?: string;
    status?: ProductStatus;
  }) {
    const where: Prisma.ProductWhereInput = {
      status: filters.status ?? ProductStatus.ACTIVE,
    };

    if (filters.category) {
      where.category = { slug: filters.category };
    }

    if (filters.brand) {
      where.brand = { slug: filters.brand };
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        variants: {
          include: {
            inventory: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return products.map((product) => serializeProduct(product));
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
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
}
