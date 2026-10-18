import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeOrder } from './order.serializer.js';

export type CheckoutShippingInput = {
  email?: string;
  fullName?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string | null;
  postalCode?: string;
  country?: string;
  phone?: string | null;
};

@Injectable()
export class CheckoutService {
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

  private orderInclude() {
    return {
      items: {
        orderBy: { createdAt: 'asc' as const },
      },
    };
  }

  private validateShipping(input: CheckoutShippingInput) {
    const email = input.email?.trim() ?? '';
    const fullName = input.fullName?.trim() ?? '';
    const line1 = input.line1?.trim() ?? '';
    const city = input.city?.trim() ?? '';
    const postalCode = input.postalCode?.trim() ?? '';
    const country = (input.country?.trim() || 'US').toUpperCase();

    if (!email || !email.includes('@')) {
      throw new BadRequestException('A valid email is required');
    }
    if (!fullName) {
      throw new BadRequestException('fullName is required');
    }
    if (!line1) {
      throw new BadRequestException('line1 is required');
    }
    if (!city) {
      throw new BadRequestException('city is required');
    }
    if (!postalCode) {
      throw new BadRequestException('postalCode is required');
    }

    return {
      email,
      fullName,
      line1,
      line2: input.line2?.trim() || null,
      city,
      state: input.state?.trim() || null,
      postalCode,
      country,
      phone: input.phone?.trim() || null,
    };
  }

  async placeOrder(user: User, shippingInput: CheckoutShippingInput) {
    const shipping = this.validateShipping(shippingInput);
    const profile = await this.ensureProfile(user);

    const cart = await this.prisma.cart.findUnique({
      where: { profileId: profile.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                inventory: true,
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const lineItems: Array<{
        variantId: string;
        productName: string;
        variantName: string | null;
        sku: string;
        unitPrice: number;
        quantity: number;
      }> = [];

      for (const item of cart.items) {
        const variant = item.variant;
        if (!variant || variant.product.status !== 'ACTIVE') {
          throw new BadRequestException(
            `Variant ${item.variantId} is no longer available`,
          );
        }

        const inventory = await tx.inventory.findUnique({
          where: { variantId: variant.id },
        });

        const available =
          (inventory?.quantity ?? 0) - (inventory?.reserved ?? 0);
        if (available < item.quantity) {
          throw new BadRequestException(
            `Not enough stock for ${variant.product.name} (${variant.name ?? variant.sku})`,
          );
        }

        const unitPrice = Number(variant.price);
        subtotal += unitPrice * item.quantity;

        lineItems.push({
          variantId: variant.id,
          productName: variant.product.name,
          variantName: variant.name,
          sku: variant.sku,
          unitPrice,
          quantity: item.quantity,
        });

        await tx.inventory.update({
          where: { variantId: variant.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      const created = await tx.order.create({
        data: {
          profileId: profile.id,
          status: 'CONFIRMED',
          subtotal,
          total: subtotal,
          currency: 'USD',
          ...shipping,
          items: {
            create: lineItems,
          },
        },
        include: this.orderInclude(),
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return created;
    });

    return serializeOrder(order as unknown as Record<string, unknown>);
  }

  async listOrders(user: User) {
    const profile = await this.ensureProfile(user);
    const orders = await this.prisma.order.findMany({
      where: { profileId: profile.id },
      include: this.orderInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) =>
      serializeOrder(order as unknown as Record<string, unknown>),
    );
  }

  async getOrder(user: User, orderId: string) {
    const profile = await this.ensureProfile(user);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, profileId: profile.id },
      include: this.orderInclude(),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return serializeOrder(order as unknown as Record<string, unknown>);
  }

  async cancelOrder(user: User, orderId: string) {
    const profile = await this.ensureProfile(user);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, profileId: profile.id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.status === 'FULFILLED' ||
      order.status === 'CANCELLED' ||
      order.status === 'SHIPPED'
    ) {
      throw new BadRequestException(
        'This order can no longer be cancelled',
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
      include: this.orderInclude(),
    });

    return serializeOrder(updated as unknown as Record<string, unknown>);
  }

  async deleteOrder(user: User, orderId: string) {
    const profile = await this.ensureProfile(user);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, profileId: profile.id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.order.delete({
      where: { id: order.id },
    });

    return { ok: true, id: order.id };
  }
}
