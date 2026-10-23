function money(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return null;
  }
  return amount.toFixed(2);
}

function record(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function serializeCart(cart: Record<string, unknown>) {
  const rawItems = Array.isArray(cart.items) ? cart.items : [];
  let subtotal = 0;
  let itemCount = 0;

  const items = rawItems.map((item) => {
    const row = record(item) ?? {};
    const variant = record(row.variant);
    const product = variant ? record(variant.product) : null;
    const inventory = variant ? record(variant.inventory) : null;
    const quantity = typeof row.quantity === 'number' ? row.quantity : 0;
    const price = Number(variant?.price ?? 0);
    const available = Math.max(
      0,
      Number(inventory?.quantity ?? 0) - Number(inventory?.reserved ?? 0),
    );
    const active = product?.status === 'ACTIVE';
    const lineTotal = Number.isFinite(price) ? price * quantity : 0;
    subtotal += lineTotal;
    itemCount += quantity;

    let notice: string | null = null;
    if (!active || available <= 0) {
      notice = 'This item is currently unavailable.';
    } else if (quantity > available) {
      notice = `Only ${available} ${available === 1 ? 'is' : 'are'} currently available.`;
    }

    return {
      ...row,
      lineTotal: lineTotal.toFixed(2),
      available,
      purchasable: active && available >= quantity && quantity > 0,
      notice,
      variant: variant
        ? {
            ...variant,
            price: money(variant.price),
            compareAtPrice: money(variant.compareAtPrice),
          }
        : variant,
    };
  });

  return {
    ...cart,
    items,
    subtotal: subtotal.toFixed(2),
    itemCount,
  };
}
