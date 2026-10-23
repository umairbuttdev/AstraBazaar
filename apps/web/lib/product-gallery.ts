import type { Product, ProductImage, ProductVariant } from "@/lib/types";

const COLOR_KEYS = new Set(["color", "colour", "shade", "finish"]);
const SIZE_KEYS = new Set(["size", "eu", "uk", "us", "length", "fit"]);

function attributeEntries(variant: ProductVariant) {
  if (!variant.attributes) return [];
  return Object.entries(variant.attributes).filter(
    (entry): entry is [string, string | number] =>
      typeof entry[1] === "string" || typeof entry[1] === "number",
  );
}

function uniqueImages(images: ProductImage[]) {
  const seen = new Set<string>();
  const list: ProductImage[] = [];
  for (const image of images) {
    if (seen.has(image.id)) continue;
    seen.add(image.id);
    list.push(image);
  }
  return list;
}

/** All images attached to a specific variant (from variant.images or product.images). */
export function imagesForVariantId(product: Product, variantId: string) {
  const fromVariant =
    product.variants.find((item) => item.id === variantId)?.images ?? [];
  const fromProduct = product.images.filter(
    (image) => image.variantId === variantId,
  );
  return uniqueImages([...fromVariant, ...fromProduct]);
}

/**
 * Prefer a "look" attribute (color/shade) so size changes keep the same photo set.
 * Falls back to the first non-size attribute when present.
 */
export function galleryGroupKey(variant: ProductVariant) {
  const entries = attributeEntries(variant);
  const color = entries.find(([key]) => COLOR_KEYS.has(key));
  if (color) return { key: color[0], value: String(color[1]) };
  const other = entries.find(([key]) => !SIZE_KEYS.has(key));
  if (other) return { key: other[0], value: String(other[1]) };
  return null;
}

/**
 * Gallery for the selected variant:
 * 1. That variant's own images
 * 2. Else images from siblings that share the same look (e.g. same color)
 * 3. Else product-level images (no variantId)
 *
 * Never mixes in photos from a different color/look.
 */
export function galleryImagesForVariant(
  product: Product,
  variant: ProductVariant,
): ProductImage[] {
  const own = imagesForVariantId(product, variant.id);
  if (own.length > 0) return own;

  const group = galleryGroupKey(variant);
  if (group) {
    const siblingImages = product.variants
      .filter((item) => {
        const attrs = Object.fromEntries(
          attributeEntries(item).map(([key, value]) => [key, String(value)]),
        );
        return attrs[group.key] === group.value;
      })
      .flatMap((item) => imagesForVariantId(product, item.id));
    const unique = uniqueImages(siblingImages);
    if (unique.length > 0) return unique;
  }

  return uniqueImages(product.images.filter((image) => !image.variantId));
}

/** First image for a color/look swatch (or any attribute value). */
export function swatchImageForAttribute(
  product: Product,
  key: string,
  value: string,
) {
  const match = product.variants.find((item) => {
    const attrs = Object.fromEntries(
      attributeEntries(item).map(([attrKey, attrValue]) => [
        attrKey,
        String(attrValue),
      ]),
    );
    return attrs[key] === value;
  });
  if (!match) {
    return product.images.find((image) => !image.variantId) ?? product.images[0] ?? null;
  }
  const gallery = galleryImagesForVariant(product, match);
  return gallery[0] ?? null;
}
