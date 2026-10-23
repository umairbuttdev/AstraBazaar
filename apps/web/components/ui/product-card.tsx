import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductImage } from "@/components/product-image";
import { WishlistButton } from "@/components/wishlist-button";
import { getPrimaryImage, getProductPricing } from "@/lib/product-pricing";
import { getWishlist } from "@/lib/wishlist-api";
import type { Product } from "@/lib/types";
import { Badge } from "./badge";
import { PriceDisplay } from "./price-display";

type ProductCardProps = {
  product: Product;
  returnTo?: string;
  priority?: boolean;
};

export async function ProductCard({
  product,
  returnTo = "/",
  priority = false,
}: ProductCardProps) {
  const image = getPrimaryImage(product);
  const pricing = getProductPricing(product);
  const wishlist = await getWishlist();
  const saved = Boolean(
    wishlist?.items.some((item) => item.productId === product.id),
  );
  const badge =
    pricing?.discountPercent && pricing.discountPercent > 0
      ? `${pricing.discountPercent}% off`
      : product.brand?.name;

  return (
    <article className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface-secondary">
        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0"
          aria-label={product.name}
        >
          <ProductImage
            src={image?.url}
            alt={image?.alt ?? product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        {badge ? (
          <div className="absolute top-3 left-3 z-10">
            <Badge tone={pricing?.discountPercent ? "primary" : "neutral"}>
              {badge}
            </Badge>
          </div>
        ) : null}
        <WishlistButton
          productId={product.id}
          saved={saved}
          returnTo={returnTo}
          className="absolute top-3 right-3 z-10"
        />
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-2">
        <div>
          <h3 className="text-h3 text-foreground">
            <Link
              href={`/products/${product.slug}`}
              className="transition-colors hover:text-primary"
            >
              {product.name}
            </Link>
          </h3>
          {product.category?.name ? (
            <p className="text-body-sm mt-1 text-foreground-muted">
              {product.category.name}
            </p>
          ) : null}
        </div>

        {pricing ? (
          <PriceDisplay
            price={pricing.price}
            compareAtPrice={pricing.compareAtPrice}
            discountPercent={pricing.discountPercent}
          />
        ) : null}

        <div className="mt-auto pt-3">
          {pricing?.inStock && pricing.variant ? (
            <AddToCartButton
              variantId={pricing.variant.id}
              returnTo={returnTo}
              productName={product.name}
              price={pricing.price}
            />
          ) : (
            <p className="text-body-sm text-foreground-muted">Sold out</p>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-md bg-surface-secondary" />
      <div className="mt-4 h-5 w-2/3 rounded bg-surface-secondary" />
      <div className="mt-2 h-4 w-1/3 rounded bg-surface-secondary" />
      <div className="mt-4 h-10 w-full rounded-md bg-surface-secondary" />
    </div>
  );
}
