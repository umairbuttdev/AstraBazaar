import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeCart } from './cart.serializer.js';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureProfile(user: User) {
    if (!user.email) {
      throw new BadRequestException('Authenticated user has no email');
    }

    return this.prisma.profile.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        fullName:
          typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : undefined,
      },
      create: {
        id: user.id,
        email: user.email,
        fullName:
          typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : null,
      },
    });
  }

  private async getOrCreateCart(profileId: string) {
    return this.prisma.cart.upsert({
      where: { profileId },
      update: {},
      create: { profileId },
    });
  }

  private cartInclude() {
    return {
      items: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: [
                      { isPrimary: 'desc' as const },
                      { sortOrder: 'asc' as const },
                    ],
                    take: 1,
                  },
                },
              },
              inventory: true,
            },
          },
        },
      },
    };
  }

  async getCart(user: User) {
    const profile = await this.ensureProfile(user);
    const cart = await this.getOrCreateCart(profile.id);
    const full = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: this.cartInclude(),
    });
    return serializeCart(full);
  }

  async addItem(user: User, variantId: string, quantity = 1) {
    if (!variantId) {
      throw new BadRequestException('variantId is required');
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('quantity must be a positive integer');
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true, product: true },
    });

    if (!variant || variant.product.status !== 'ACTIVE') {
      throw new NotFoundException('Variant not found');
    }

    const available =
      (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0);
    if (available < quantity) {
      throw new BadRequestException('Not enough stock for this variant');
    }

    const profile = await this.ensureProfile(user);
    const cart = await this.getOrCreateCart(profile.id);

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (available < nextQuantity) {
      throw new BadRequestException('Not enough stock for this variant');
    }

    await this.prisma.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
      update: { quantity: nextQuantity },
      create: {
        cartId: cart.id,
        variantId,
        quantity,
      },
    });

    return this.getCart(user);
  }

  async updateItem(user: User, itemId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('quantity must be a positive integer');
    }

    const profile = await this.ensureProfile(user);
    const cart = await this.getOrCreateCart(profile.id);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { variant: { include: { inventory: true } } },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    const available =
      (item.variant.inventory?.quantity ?? 0) -
      (item.variant.inventory?.reserved ?? 0);
    if (available < quantity) {
      throw new BadRequestException('Not enough stock for this variant');
    }

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    return this.getCart(user);
  }

  async removeItem(user: User, itemId: string) {
    const profile = await this.ensureProfile(user);
    const cart = await this.getOrCreateCart(profile.id);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.getCart(user);
  }
}
