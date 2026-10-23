import {
  SIZE_KEYS,
  attributeEntries,
  compareOptionValues,
  sizeValueFor,
} from "@/lib/product-options";
import type { ProductVariant } from "@/lib/types";

export type AdminVariantGroup = {
  key: string;
  label: string;
  look: Array<{ name: string; value: string }>;
  variants: ProductVariant[];
  isDefault: boolean;
  totalStock: number;
  priceLabel: string;
  imageCount: number;
};

function lookEntries(variant: ProductVariant) {
  return attributeEntries(variant)
    .filter(([key]) => !SIZE_KEYS.has(key))
    .map(([name, value]) => ({ name, value: String(value) }));
}

function lookGroupKey(variant: ProductVariant) {
  const look = lookEntries(variant);
  if (look.length === 0) {
    return sizeValueFor(variant) ? "__sizes__" : `__solo__:${variant.id}`;
  }
  return look
    .map((row) => `${row.name}=${row.value}`)
    .sort((a, b) => a.localeCompare(b))
    .join("|");
}

function lookLabel(look: Array<{ name: string; value: string }>, key: string) {
  if (look.length > 0) {
    return look
      .map((row) => `${row.name.replace(/_/g, " ")}: ${row.value}`)
      .join(" · ");
  }
  if (key === "__sizes__") return "Sizes";
  return "Version";
}

function availableStock(variant: ProductVariant) {
  return Math.max(
    0,
    (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0),
  );
}

function priceLabel(variants: ProductVariant[]) {
  const prices = [
    ...new Set(
      variants.map((variant) => Number(variant.price)).filter(Number.isFinite),
    ),
  ].sort((a, b) => a - b);
  if (prices.length === 0) return "—";
  const format = (value: number) => value.toFixed(2);
  if (prices.length === 1) return `$${format(prices[0]!)}`;
  return `$${format(prices[0]!)} – $${format(prices[prices.length - 1]!)}`;
}

function sortGroupVariants(variants: ProductVariant[]) {
  return [...variants].sort((left, right) => {
    const leftSize = sizeValueFor(left);
    const rightSize = sizeValueFor(right);
    if (leftSize && rightSize) return compareOptionValues(leftSize, rightSize);
    if (leftSize) return -1;
    if (rightSize) return 1;
    return left.sku.localeCompare(right.sku);
  });
}

/** Group sellable SKUs by look (color/shade/…); sizes stay separate rows inside each group. */
export function groupAdminVariants(
  variants: ProductVariant[],
): AdminVariantGroup[] {
  const buckets = new Map<string, ProductVariant[]>();

  for (const variant of variants) {
    const key = lookGroupKey(variant);
    const list = buckets.get(key) ?? [];
    list.push(variant);
    buckets.set(key, list);
  }

  return [...buckets.entries()].map(([key, items]) => {
    const sorted = sortGroupVariants(items);
    const look = lookEntries(sorted[0]!);
    return {
      key,
      label: lookLabel(look, key),
      look,
      variants: sorted,
      isDefault: sorted.some((item) => item.isDefault),
      totalStock: sorted.reduce((sum, item) => sum + availableStock(item), 0),
      priceLabel: priceLabel(sorted),
      imageCount: sorted.reduce(
        (sum, item) => sum + (item.images?.length ?? 0),
        0,
      ),
    };
  });
}

export function sizeLabelFor(variant: ProductVariant) {
  return sizeValueFor(variant) ?? "—";
}

export function availableUnits(variant: ProductVariant) {
  return availableStock(variant);
}
