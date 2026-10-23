import { canCancelOrder } from './checkout.rules.js';

function money(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value).toFixed(2);
}

export function serializeOrder(order: Record<string, unknown>) {
  const items = Array.isArray(order.items)
    ? order.items.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          ...row,
          unitPrice: money(row.unitPrice),
        };
      })
    : order.items;

  return {
    ...order,
    subtotal: money(order.subtotal),
    shippingAmount: money(order.shippingAmount),
    total: money(order.total),
    items,
  };
}

type CustomerOrderItem = {
  id: string;
  productName: string;
  variantName: string | null;
  sku: string;
  unitPrice: unknown;
  quantity: number;
  variant?: { product?: { slug: string; status: string } | null } | null;
};

type CustomerOrderRecord = {
  id: string;
  status: string;
  createdAt: Date;
  subtotal: unknown;
  shippingAmount: unknown;
  total: unknown;
  currency: string;
  shippingMethod: string;
  paymentMethod: string;
  paymentStatus: string;
  email: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  statusHistory?: Array<{ id: string; status: string; createdAt: Date }>;
  items: CustomerOrderItem[];
};

function customerItems(items: CustomerOrderItem[]) {
  return items.map((item) => ({
    id: item.id,
    productName: item.productName,
    variantName: item.variantName,
    sku: item.sku,
    unitPrice: money(item.unitPrice),
    quantity: item.quantity,
    productSlug:
      item.variant?.product?.status === 'ACTIVE'
        ? item.variant.product.slug
        : null,
  }));
}

export function serializeCustomerOrder(
  order: CustomerOrderRecord,
  options?: { detail?: boolean },
) {
  const items = customerItems(order.items);
  const detail = options?.detail === true;

  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    subtotal: money(order.subtotal),
    shippingAmount: money(order.shippingAmount),
    total: money(order.total),
    currency: order.currency,
    shippingMethod: order.shippingMethod,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    canCancel: canCancelOrder(order.status),
    shipment: null,
    lineCount: items.length,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items: detail ? items : items.slice(0, 2),
    ...(detail
      ? {
          email: order.email,
          fullName: order.fullName,
          line1: order.line1,
          line2: order.line2,
          city: order.city,
          state: order.state,
          postalCode: order.postalCode,
          country: order.country,
          phone: order.phone,
          statusHistory: (order.statusHistory ?? []).map((entry) => ({
            id: entry.id,
            status: entry.status,
            createdAt: entry.createdAt,
          })),
        }
      : {}),
  };
}
