import type { ProductVariant } from "@/lib/types";

export const COLOR_KEYS = new Set(["color", "colour", "shade", "finish"]);
export const SIZE_KEYS = new Set(["size", "eu", "uk", "us", "length", "fit"]);

export function attributeEntries(variant: ProductVariant) {
  if (!variant.attributes) return [];
  return Object.entries(variant.attributes).filter(
    (entry): entry is [string, string | number] =>
      typeof entry[1] === "string" || typeof entry[1] === "number",
  );
}

/** Ascending for sizes (6 before 10) and other numeric-ish labels. */
export function compareOptionValues(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export function sortOptionValues(values: string[]) {
  return [...values].sort(compareOptionValues);
}

export function sizeKeyFor(variant: ProductVariant) {
  for (const [key] of attributeEntries(variant)) {
    if (SIZE_KEYS.has(key)) return key;
  }
  return null;
}

export function sizeValueFor(variant: ProductVariant) {
  const key = sizeKeyFor(variant);
  if (!key || !variant.attributes) return null;
  const value = variant.attributes[key];
  return value === undefined || value === null ? null : String(value);
}

export function colorKeyFor(variant: ProductVariant) {
  for (const [key] of attributeEntries(variant)) {
    if (COLOR_KEYS.has(key)) return key;
  }
  return null;
}

function sortBySize(variants: ProductVariant[]) {
  return [...variants].sort((left, right) => {
    const leftSize = sizeValueFor(left);
    const rightSize = sizeValueFor(right);
    if (leftSize && rightSize) return compareOptionValues(leftSize, rightSize);
    if (leftSize) return -1;
    if (rightSize) return 1;
    return 0;
  });
}

function lookPool(variants: ProductVariant[], colorKey: string, colorValue: string) {
  return variants.filter((item) => {
    const attrs = item.attributes;
    return attrs ? String(attrs[colorKey] ?? "") === colorValue : false;
  });
}

/**
 * Default purchasable option: default look (isDefault's color, else first
 * color A–Z), always the smallest size for that look.
 */
export function pickDefaultVariant(variants: ProductVariant[]) {
  if (variants.length === 0) return undefined;

  const flagged = variants.find((item) => item.isDefault);
  let colorKey =
    (flagged ? colorKeyFor(flagged) : null) ??
    variants.map(colorKeyFor).find((key): key is string => Boolean(key)) ??
    null;

  let colorValue = "";
  if (colorKey) {
    if (flagged?.attributes && flagged.attributes[colorKey] != null) {
      colorValue = String(flagged.attributes[colorKey]);
    } else {
      const colors = sortOptionValues([
        ...new Set(
          variants
            .map((item) =>
              item.attributes ? String(item.attributes[colorKey!] ?? "") : "",
            )
            .filter(Boolean),
        ),
      ]);
      colorValue = colors[0] ?? "";
    }
  }

  const pool =
    colorKey && colorValue
      ? lookPool(variants, colorKey, colorValue)
      : variants;
  const ranked = sortBySize(pool.length > 0 ? pool : variants);
  return ranked[0] ?? flagged ?? variants[0];
}

/**
 * Resolve the next variant after a choice click.
 * Changing look (color/shade/…) always lands on the smallest size for that look.
 */
export function pickVariantForAttributes(
  variants: ProductVariant[],
  groups: string[],
  selected: Record<string, string>,
  changedKey: string,
  changedValue: string,
) {
  if (COLOR_KEYS.has(changedKey)) {
    const forLook = lookPool(variants, changedKey, changedValue);
    if (forLook.length === 0) return undefined;
    return sortBySize(forLook)[0];
  }

  const next = { ...selected, [changedKey]: changedValue };
  const exact = variants.find((item) => {
    const attrs = Object.fromEntries(
      attributeEntries(item).map(([key, value]) => [key, String(value)]),
    );
    return groups.every((group) => attrs[group] === String(next[group] ?? ""));
  });
  if (exact) return exact;

  const partial = variants.filter((item) => {
    const attrs = Object.fromEntries(
      attributeEntries(item).map(([key, value]) => [key, String(value)]),
    );
    return attrs[changedKey] === changedValue;
  });
  if (partial.length === 0) return undefined;

  return sortBySize(partial)[0] ?? partial[0];
}
