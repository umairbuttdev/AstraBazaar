import { Prisma } from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeCustomerOrder, serializeOrder } from './order.serializer.js';
import {
  attributeSummary,
  money,
  ONLINE_PAYMENT_UNAVAILABLE,
  orderTotal,
  paymentOptions,
  shippingAmountFor,
  SHIPPING_UNAVAILABLE,
  STANDARD_SHIPPING_METHOD,
  TOTAL_CHANGED,
  totalsMatch,
  canCancelOrder,
} from './checkout.rules.js';

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
  paymentMethod?: string;
  shippingMethod?: string;
  expectedTotal?: string;
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

  private cartInclude() {
    return {
      items: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          variant: {
            include: {
              inventory: true,
              product: true,
            },
          },
        },
      },
    };
  }

  private describeLines(
    items: Array<{
      id: string;
      quantity: number;
      variantId: string;
      variant: {
        id: string;
        sku: string;
        name: string | null;
        price: unknown;
        attributes: unknown;
        product: { name: string; slug: string; status: string };
        inventory: { quantity: number; reserved: number } | null;
      } | null;
    }>,
  ) {
    const issues: string[] = [];
    const lines: Array<{
      id: string;
      quantity: number;
      unitPrice: string;
      lineTotal: string;
      available: number;
      issue: string | null;
      variantId: string;
      variantName: string | null;
      sku: string;
      productName: string;
      productSlug: string;
      attributes: unknown;
    }> = [];
    let subtotal = 0;

    for (const item of items) {
      const variant = item.variant;
      const available = variant
        ? Math.max(
            0,
            (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0),
          )
        : 0;
      const active = variant?.product.status === 'ACTIVE';
      let issue: string | null = null;

      if (!variant || !active) {
        issue = `${variant?.product.name ?? 'An item'} is no longer available.`;
      } else if (available < item.quantity) {
        issue =
          available <= 0
            ? `${variant.product.name} is no longer available in the requested quantity.`
            : `Only ${available} ${available === 1 ? 'is' : 'are'} available for ${variant.product.name}.`;
      }

      if (issue) {
        issues.push(issue);
      }

      const unitPrice = Number(variant?.price ?? 0);
      const lineTotal = Number.isFinite(unitPrice) ? unitPrice * item.quantity : 0;
      if (!issue) {
        subtotal += lineTotal;
      }

      lines.push({
        id: item.id,
        quantity: item.quantity,
        unitPrice: money(Number.isFinite(unitPrice) ? unitPrice : 0),
        lineTotal: money(lineTotal),
        available,
        issue,
        variantId: variant?.id ?? item.variantId,
        variantName: variant
          ? (variant.name ?? attributeSummary(variant.attributes))
          : null,
        sku: variant?.sku ?? '',
        productName: variant?.product.name ?? 'Unavailable item',
        productSlug: variant?.product.slug ?? '',
        attributes: variant?.attributes ?? null,
      });
    }

    return { lines, issues, subtotal };
  }

  async quote(user: User) {
    const profile = await this.ensureProfile(user);
    const cart = await this.prisma.cart.findUnique({
      where: { profileId: profile.id },
      include: this.cartInclude(),
    });
    const described = this.describeLines(cart?.items ?? []);
    const issues = [...described.issues];
    if (!cart || cart.items.length === 0) {
      issues.unshift('Your cart is empty.');
    }
    const shippingAmount = Number(STANDARD_SHIPPING_METHOD.amount);
    const total = orderTotal(described.subtotal, shippingAmount);

    return {
      items: described.lines,
      subtotal: money(described.subtotal),
      discount: '0.00',
      shipping: STANDARD_SHIPPING_METHOD,
      shippingMethods: [STANDARD_SHIPPING_METHOD],
      total,
      currency: 'USD',
      ready: issues.length === 0,
      issues,
      paymentMethods: paymentOptions(),
    };
  }

  async listAddresses(user: User) {
    const profile = await this.ensureProfile(user);
    const addresses = await this.prisma.address.findMany({
      where: { profileId: profile.id },
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
    });

    return addresses;
  }

  private async rememberAddress(
    tx: Prisma.TransactionClient,
    profileId: string,
    shipping: {
      fullName: string;
      line1: string;
      line2: string | null;
      city: string;
      state: string | null;
      postalCode: string;
      country: string;
      phone: string | null;
    },
  ) {
    const existing = await tx.address.findFirst({
      where: {
        profileId,
        fullName: shipping.fullName,
        line1: shipping.line1,
        line2: shipping.line2,
        city: shipping.city,
        state: shipping.state,
        postalCode: shipping.postalCode,
        country: shipping.country,
        phone: shipping.phone,
      },
    });
    if (existing) return existing;

    const count = await tx.address.count({ where: { profileId } });
    return tx.address.create({
      data: {
        profileId,
        fullName: shipping.fullName,
        line1: shipping.line1,
        line2: shipping.line2,
        city: shipping.city,
        state: shipping.state,
        postalCode: shipping.postalCode,
        country: shipping.country,
        phone: shipping.phone,
        isDefault: count === 0,
      },
    });
  }

  async placeOrder(user: User, shippingInput: CheckoutShippingInput) {
    const shipping = this.validateShipping(shippingInput);
    const paymentMethod = (shippingInput.paymentMethod ?? 'cod').trim().toLowerCase();
    const shippingMethod = (
      shippingInput.shippingMethod ?? STANDARD_SHIPPING_METHOD.id
    )
      .trim()
      .toLowerCase();

    if (paymentMethod === 'online') {
      throw new BadRequestException(ONLINE_PAYMENT_UNAVAILABLE);
    }
    if (paymentMethod !== 'cod') {
      throw new BadRequestException('Choose a valid payment method.');
    }

    const shippingAmount = shippingAmountFor(shippingMethod);
    if (shippingAmount === null) {
      throw new BadRequestException(SHIPPING_UNAVAILABLE);
    }

    const profile = await this.ensureProfile(user);
    const existingCart = await this.prisma.cart.findUnique({
      where: { profileId: profile.id },
      select: { id: true },
    });

    if (!existingCart) {
      throw new BadRequestException('Your cart is empty.');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM carts WHERE id = ${existingCart.id} FOR UPDATE`;

      const cart = await tx.cart.findUnique({
        where: { id: existingCart.id },
        include: this.cartInclude(),
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Your cart is empty.');
      }

      const described = this.describeLines(cart.items);
      if (described.issues.length > 0) {
        throw new BadRequestException(described.issues[0]);
      }

      const total = orderTotal(described.subtotal, shippingAmount);
      if (!totalsMatch(shippingInput.expectedTotal, total)) {
        throw new BadRequestException(TOTAL_CHANGED);
      }

      for (const line of described.lines) {
        const updated = await tx.$executeRaw`
          UPDATE inventory
          SET quantity = quantity - ${line.quantity}, "updatedAt" = NOW()
          WHERE "variantId" = ${line.variantId}
            AND (quantity - reserved) >= ${line.quantity}
        `;
        if (Number(updated) !== 1) {
          throw new BadRequestException(
            `${line.productName} is no longer available in the requested quantity.`,
          );
        }
      }

      const created = await tx.order.create({
        data: {
          profileId: profile.id,
          status: 'CONFIRMED',
          subtotal: described.subtotal,
          shippingAmount,
          total,
          currency: 'USD',
          shippingMethod,
          paymentMethod: 'COD',
          paymentStatus: 'UNPAID',
          ...shipping,
          items: {
            create: described.lines.map((line) => ({
              variantId: line.variantId,
              productName: line.productName,
              variantName: line.variantName,
              sku: line.sku,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
            })),
          },
          statusHistory: {
            create: { status: 'CONFIRMED' },
          },
        },
        include: this.orderInclude(),
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
      await this.rememberAddress(tx, profile.id, shipping);

      return created;
    });

    return serializeOrder(order as unknown as Record<string, unknown>);
  }

  private customerOrderInclude(detail: boolean) {
    return {
      items: {
        orderBy: { createdAt: 'asc' as const },
        ...(detail
          ? {
              include: {
                variant: {
                  select: {
                    product: {
                      select: { slug: true, status: true },
                    },
                  },
                },
              },
            }
          : {}),
      },
      ...(detail
        ? { statusHistory: { orderBy: { createdAt: 'asc' as const } } }
        : {}),
    };
  }

  async listOrders(
    user: User,
    query: { page?: string; limit?: string; filter?: string },
  ) {
    const profile = await this.ensureProfile(user);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(query.limit) || 10));
    const filter = query.filter ?? 'all';
    const where: Prisma.OrderWhereInput = { profileId: profile.id };
    if (filter === 'active') {
      where.status = { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] };
    } else if (filter === 'completed') {
      where.status = 'FULFILLED';
    } else if (filter === 'cancelled') {
      where.status = 'CANCELLED';
    }

    const [orders, total, grouped] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: this.customerOrderInclude(false),
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { profileId: profile.id },
        _count: { _all: true },
      }),
    ]);

    const counts = { all: 0, active: 0, completed: 0, cancelled: 0 };
    for (const row of grouped) {
      counts.all += row._count._all;
      if (row.status === 'FULFILLED') counts.completed += row._count._all;
      else if (row.status === 'CANCELLED') counts.cancelled += row._count._all;
      else counts.active += row._count._all;
    }

    return {
      items: orders.map((order) =>
        serializeCustomerOrder(order as unknown as Parameters<typeof serializeCustomerOrder>[0]),
      ),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      counts,
    };
  }

  async getOrder(user: User, orderId: string) {
    const profile = await this.ensureProfile(user);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, profileId: profile.id },
      include: this.customerOrderInclude(true),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return serializeCustomerOrder(
      order as unknown as Parameters<typeof serializeCustomerOrder>[0],
      { detail: true },
    );
  }

  private async restoreInventory(
    tx: Prisma.TransactionClient,
    orderId: string,
  ) {
    const items = await tx.orderItem.findMany({
      where: { orderId },
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

  async cancelOrder(user: User, orderId: string) {
    const profile = await this.ensureProfile(user);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} AND "profileId" = ${profile.id} FOR UPDATE`;
      const order = await tx.order.findFirst({
        where: { id: orderId, profileId: profile.id },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (!canCancelOrder(order.status)) {
        throw new BadRequestException('This order can no longer be cancelled');
      }

      await this.restoreInventory(tx, order.id);

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          statusHistory: { create: { status: 'CANCELLED' } },
        },
        include: this.orderInclude(),
      });
      return updated;
    });

    return serializeOrder(updated as unknown as Record<string, unknown>);
  }

  async deleteOrder(user: User, orderId: string) {
    const profile = await this.ensureProfile(user);

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} AND "profileId" = ${profile.id} FOR UPDATE`;
      const order = await tx.order.findFirst({
        where: { id: orderId, profileId: profile.id },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (canCancelOrder(order.status)) {
        await this.restoreInventory(tx, order.id);
      }

      await tx.orderStatusHistory.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.order.delete({
        where: { id: order.id },
      });

      return { ok: true, id: order.id };
    });
  }
}
