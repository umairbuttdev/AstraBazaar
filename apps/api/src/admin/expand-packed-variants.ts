export type PackedVariantSource = {
  id: string;
  sku: string;
  name: string | null;
  price: unknown;
  compareAtPrice: unknown;
  attributes: Record<string, string> | null;
  quantity: number;
  reserved: number;
  imageUrls: Array<{ url: string; alt: string | null; sortOrder: number }>;
};

export type ExpandedVariantDraft = {
  sku: string;
  name: string | null;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  reserved: number;
  attributes: Record<string, string>;
  imageUrls: Array<{ url: string; alt: string | null; sortOrder: number }>;
  isDefault: boolean;
};

function parsePackedValue(value: string) {
  return [
    ...new Set(
      value
        .split(/[\n,]+/)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Expand variants whose attribute values contain comma-separated lists into one variant per combination. */
export function expandPackedVariants(
  sources: PackedVariantSource[],
): ExpandedVariantDraft[] | null {
  const needsExpand = sources.some((source) =>
    Object.values(source.attributes ?? {}).some((value) => /[,\n]/.test(value)),
  );
  if (!needsExpand) return null;

  const drafts: ExpandedVariantDraft[] = [];
  let defaultAssigned = false;

  for (const source of sources) {
    const attrs = source.attributes ?? {};
    const axes = Object.entries(attrs).map(([name, value]) => ({
      name,
      values: parsePackedValue(String(value)),
    }));
    if (axes.some((axis) => axis.values.length === 0)) continue;

    const combos = axes.reduce<Array<Array<{ name: string; value: string }>>>(
      (rows, axis) => {
        if (rows.length === 0) {
          return axis.values.map((value) => [{ name: axis.name, value }]);
        }
        return rows.flatMap((row) =>
          axis.values.map((value) => [...row, { name: axis.name, value }]),
        );
      },
      [],
    );

    const share = Math.floor(source.quantity / Math.max(combos.length, 1));
    let remainder = source.quantity - share * combos.length;
    const reservedShare = Math.floor(source.reserved / Math.max(combos.length, 1));
    let reservedRemainder = source.reserved - reservedShare * combos.length;

    for (const combo of combos) {
      const attributes = Object.fromEntries(
        combo.map((item) => [item.name, item.value]),
      );
      const label = combo.map((item) => item.value).join(' / ');
      const quantity = share + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
      const reserved = reservedShare + (reservedRemainder > 0 ? 1 : 0);
      if (reservedRemainder > 0) reservedRemainder -= 1;

      drafts.push({
        sku: `${slugPart(source.sku)}-${combo.map((item) => slugPart(item.value)).join('-')}`.slice(0, 60),
        name: source.name ? `${source.name} · ${label}` : label,
        price: Number(source.price),
        compareAtPrice:
          source.compareAtPrice === null || source.compareAtPrice === undefined
            ? null
            : Number(source.compareAtPrice),
        quantity,
        reserved,
        attributes,
        imageUrls: source.imageUrls,
        isDefault: !defaultAssigned,
      });
      defaultAssigned = true;
    }
  }

  return drafts;
}
