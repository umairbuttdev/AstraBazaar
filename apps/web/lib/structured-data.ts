import { getDefaultVariant, getPrimaryImage } from "./product-pricing";
import type { Product, ProductVariant } from "./types";

function available(variant: ProductVariant) {
  return (
    (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0) > 0
  );
}

export function productStructuredData(
  product: Product,
  origin: string,
  variantId?: string,
) {
  const selected =
    product.variants.find((variant) => variant.id === variantId) ??
    getDefaultVariant(product);
  const prices = product.variants
    .map((variant) => Number(variant.price))
    .filter((price) => Number.isFinite(price));
  const image = getPrimaryImage(product);
  const url = `${origin}/products/${product.slug}`;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
  };

  if (product.description) data.description = product.description;
  if (selected?.sku) data.sku = selected.sku;
  if (image?.url) data.image = [image.url];
  if (product.brand?.name) {
    data.brand = { "@type": "Brand", name: product.brand.name };
  }

  if (selected && prices.length === 1) {
    data.offers = {
      "@type": "Offer",
      url,
      price: selected.price,
      priceCurrency: "USD",
      availability: available(selected)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    };
  } else if (prices.length > 1) {
    data.offers = {
      "@type": "AggregateOffer",
      url,
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      offerCount: prices.length,
      priceCurrency: "USD",
      availability: product.variants.some(available)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    };
  }

  return data;
}

export function breadcrumbStructuredData(
  crumbs: Array<{ name: string; path: string }>,
  origin: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${origin}${crumb.path}`,
    })),
  };
}

export function websiteStructuredData(origin: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AstraBazaar",
      url: origin,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "AstraBazaar",
      url: origin,
      potentialAction: {
        "@type": "SearchAction",
        target: `${origin}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];
}
