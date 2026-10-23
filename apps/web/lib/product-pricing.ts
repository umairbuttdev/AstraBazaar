import { pickDefaultVariant } from "./product-options";
import type { Product } from "./types";

export function formatMoney(value: string) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getDefaultVariant(product: Product) {
  return pickDefaultVariant(product.variants);
}

export function getPrimaryImage(product: Product) {
  const shared = product.images.filter((image) => !image.variantId);
  const pool = shared.length > 0 ? shared : product.images;
  return pool.find((item) => item.isPrimary) ?? pool[0];
}

export function getDiscountPercent(
  price: string,
  compareAtPrice?: string | null,
) {
  const current = Number(price);
  const compare = Number(compareAtPrice);
  if (
    !compareAtPrice ||
    Number.isNaN(current) ||
    Number.isNaN(compare) ||
    compare <= current
  ) {
    return null;
  }
  return Math.round(((compare - current) / compare) * 100);
}

export function getProductPricing(product: Product) {
  const variant = getDefaultVariant(product);
  if (!variant) {
    return null;
  }

  const available =
    (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0);

  return {
    variant,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    discountPercent: getDiscountPercent(variant.price, variant.compareAtPrice),
    available,
    inStock: available > 0,
  };
}
