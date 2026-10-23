export const STANDARD_SHIPPING_METHOD = {
  id: 'standard',
  name: 'Standard delivery',
  amount: '0.00',
  estimate: null as string | null,
};

export const ONLINE_PAYMENT_UNAVAILABLE =
  'Online payment is not available yet. Choose cash on delivery to place this order.';

export const TOTAL_CHANGED =
  'The order total changed. Review checkout and place the order again.';

export const SHIPPING_UNAVAILABLE =
  'This delivery option is no longer available.';

export function money(value: number) {
  return value.toFixed(2);
}

export function orderTotal(subtotal: number, shippingAmount: number) {
  return (subtotal + shippingAmount).toFixed(2);
}

export function totalsMatch(expected: unknown, actual: string) {
  if (expected === undefined || expected === null || expected === '') {
    return true;
  }
  const amount = Number(expected);
  if (!Number.isFinite(amount)) {
    return false;
  }
  return amount.toFixed(2) === actual;
}

export function paymentOptions() {
  return [
    {
      id: 'cod' as const,
      name: 'Cash on delivery',
      available: true,
      detail: 'Pay when your order arrives. No card is charged now.',
    },
    {
      id: 'online' as const,
      name: 'Online payment',
      available: false,
      detail: 'Online payment is not configured yet.',
    },
  ];
}

export function attributeSummary(attributes: unknown) {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
    return null;
  }

  const parts = Object.entries(attributes).filter(
    (entry): entry is [string, string | number] =>
      typeof entry[1] === 'string' || typeof entry[1] === 'number',
  );

  if (parts.length === 0) {
    return null;
  }

  return parts
    .map(([key, value]) => `${key.charAt(0).toUpperCase()}${key.slice(1)}: ${value}`)
    .join(', ');
}

export function shippingAmountFor(methodId: string) {
  if (methodId !== STANDARD_SHIPPING_METHOD.id) {
    return null;
  }
  return Number(STANDARD_SHIPPING_METHOD.amount);
}

export function canCancelOrder(status: string) {
  return status === 'PENDING' || status === 'CONFIRMED' || status === 'PROCESSING';
}
