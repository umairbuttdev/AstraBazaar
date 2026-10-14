function money(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value).toFixed(2);
}

export function serializeProduct<T extends Record<string, unknown>>(product: T) {
  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant) => {
        const item = variant as Record<string, unknown>;
        return {
          ...item,
          price: money(item.price),
          compareAtPrice: money(item.compareAtPrice),
        };
      })
    : product.variants;

  return {
    ...product,
    variants,
  };
}
