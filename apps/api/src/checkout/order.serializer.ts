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
    total: money(order.total),
    items,
  };
}
