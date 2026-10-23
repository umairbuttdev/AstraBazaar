import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeWishlist } from './wishlist.serializer.js';

@Injectable()
export class WishlistService {
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

  private async getOrCreateWishlist(profileId: string) {
    return this.prisma.wishlist.upsert({
      where: { profileId },
      update: {},
      create: { profileId },
    });
  }

  private wishlistInclude() {
    return {
      items: {
        orderBy: { createdAt: 'desc' as const },
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
              variants: {
                orderBy: { createdAt: 'asc' as const },
                include: { inventory: true },
              },
            },
          },
        },
      },
    };
  }

  async getWishlist(user: User) {
    const profile = await this.ensureProfile(user);
    const wishlist = await this.getOrCreateWishlist(profile.id);
    const full = await this.prisma.wishlist.findUniqueOrThrow({
      where: { id: wishlist.id },
      include: this.wishlistInclude(),
    });
    return serializeWishlist(full);
  }

  async addItem(user: User, productId: string) {
    if (!productId) {
      throw new BadRequestException('productId is required');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const profile = await this.ensureProfile(user);
    const wishlist = await this.getOrCreateWishlist(profile.id);

    await this.prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
      update: {},
      create: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    return this.getWishlist(user);
  }

  async removeItem(user: User, productId: string) {
    if (!productId) {
      throw new BadRequestException('productId is required');
    }

    const profile = await this.ensureProfile(user);
    const wishlist = await this.getOrCreateWishlist(profile.id);
    const item = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Saved product not found');
    }

    await this.prisma.wishlistItem.delete({ where: { id: item.id } });
    return this.getWishlist(user);
  }
}
