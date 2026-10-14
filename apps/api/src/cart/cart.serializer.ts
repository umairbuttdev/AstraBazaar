function money(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value).toFixed(2);
}

export function serializeCart(cart: Record<string, unknown>) {
  const items = Array.isArray(cart.items)
    ? cart.items.map((item) => {
        const row = item as Record<string, unknown>;
        const variant = row.variant as Record<string, unknown> | undefined;
        return {
          ...row,
          variant: variant
            ? {
                ...variant,
                price: money(variant.price),
                compareAtPrice: money(variant.compareAtPrice),
              }
            : variant,
        };
      })
    : cart.items;

  return {
    ...cart,
    items,
  };
}
