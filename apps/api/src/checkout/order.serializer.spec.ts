import { describe, expect, it } from 'vitest';
import { serializeCustomerOrder } from './order.serializer.js';

describe('customer order serializer', () => {
  const order = {
    id: 'order-1',
    status: 'CONFIRMED',
    createdAt: new Date('2026-10-21T09:00:00.000Z'),
    subtotal: 129,
    shippingAmount: 0,
    total: 129,
    currency: 'USD',
    shippingMethod: 'standard',
    paymentMethod: 'COD',
    paymentStatus: 'UNPAID',
    email: 'a@example.com',
    fullName: 'A Customer',
    line1: '1 Main',
    line2: null,
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'US',
    phone: '555',
    statusHistory: [
      {
        id: 'hist-1',
        status: 'CONFIRMED',
        createdAt: new Date('2026-10-21T09:00:00.000Z'),
      },
    ],
    items: [
      {
        id: 'item-1',
        productName: 'Astra Runner',
        variantName: 'Size 8',
        sku: 'ASTRA-RUN-01-8',
        unitPrice: 129,
        quantity: 1,
        variant: { product: { slug: 'astra-runner-01', status: 'ACTIVE' } },
      },
      {
        id: 'item-2',
        productName: 'Retired shoe',
        variantName: null,
        sku: 'OLD',
        unitPrice: 10,
        quantity: 2,
        variant: { product: { slug: 'retired', status: 'ARCHIVED' } },
      },
      {
        id: 'item-3',
        productName: 'Third',
        variantName: null,
        sku: 'THIRD',
        unitPrice: 5,
        quantity: 1,
        variant: null,
      },
    ],
  };

  it('keeps snapshot fields and links only active products', () => {
    const detail = serializeCustomerOrder(order, { detail: true });
    expect(detail.shipment).toBeNull();
    expect(detail.canCancel).toBe(true);
    expect(detail.items[0]?.productSlug).toBe('astra-runner-01');
    expect(detail.items[1]?.productSlug).toBeNull();
    expect(detail.items[0]?.unitPrice).toBe('129.00');
    expect(detail.statusHistory).toHaveLength(1);
    expect(detail).not.toHaveProperty('profileId');
  });

  it('returns a short item preview for the order list', () => {
    const summary = serializeCustomerOrder(order);
    expect(summary.items).toHaveLength(2);
    expect(summary.lineCount).toBe(3);
    expect(summary.itemCount).toBe(4);
    expect(summary).not.toHaveProperty('statusHistory');
    expect(summary).not.toHaveProperty('email');
  });
});
