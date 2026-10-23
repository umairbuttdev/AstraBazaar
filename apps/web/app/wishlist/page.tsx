import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountFrame } from "@/components/account/account-frame";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/ui/price-display";
import { WishlistButton } from "@/components/wishlist-button";
import { pickDefaultVariant } from "@/lib/product-options";
import { getDiscountPercent } from "@/lib/product-pricing";
import { createClient } from "@/lib/supabase/server";
import { getWishlist } from "@/lib/wishlist-api";
import type { ProductVariant } from "@/lib/types";
import type { WishlistItem, WishlistVariant } from "@/lib/wishlist-types";

export const metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
};

type WishlistPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function displayVariant(item: WishlistItem) {
  const variants = item.product.variants as unknown as ProductVariant[];
  return pickDefaultVariant(variants) ?? variants[0] ?? null;
}

function inStockVariants(item: WishlistItem) {
  if (item.product.status !== "ACTIVE") {
    return [];
  }
  return item.product.variants.filter(
    (variant) => variant.available > 0 && variant.price,
  );
}

function variantLabel(variant: WishlistVariant) {
  const attributes = variant.attributes;
  if (attributes && typeof attributes === "object" && !Array.isArray(attributes)) {
    const lines = Object.entries(attributes).filter(
      (entry): entry is [string, string | number] =>
        typeof entry[1] === "string" || typeof entry[1] === "number",
    );
    if (lines.length > 0) {
      return lines
        .map(
          ([key, value]) =>
            `${key.charAt(0).toUpperCase()}${key.slice(1)}: ${value}`,
        )
        .join(" · ");
    }
  }
  return variant.name;
}

async function WishlistContent({ searchParams }: WishlistPageProps) {
  await connection();
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-xl">
        <p className="text-caption text-primary">Wishlist</p>
        <h2 className="text-h1 mt-3">Wishlist</h2>
        <p className="text-body mt-4 text-foreground-muted">
          Login to save products and come back to them anytime.
        </p>
        <Button href="/login?next=%2Fwishlist" className="mt-8" variant="dark">
          Login
        </Button>
      </div>
    );
  }

  const wishlist = await getWishlist();

  if (!wishlist) {
    return (
      <div className="max-w-xl">
        <p className="text-caption text-primary">Wishlist</p>
        <h2 className="text-h1 mt-3">Wishlist</h2>
        <p className="text-body mt-4 text-foreground-muted">
          We couldn&apos;t load your wishlist. Please try again.
        </p>
        <Button href="/wishlist" className="mt-8" variant="dark">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-xl">
        <p className="text-caption text-primary">Wishlist</p>
        <h2 className="text-h1 mt-3">Wishlist</h2>
        <p className="text-body mt-4 text-foreground-muted">
          {wishlist.items.length === 0
            ? "Your wishlist is empty."
            : "Your saved products"}
        </p>
      </div>

      {params.error ? (
        <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {params.error}
        </p>
      ) : null}

      {wishlist.items.length === 0 ? (
        <div className="mt-10 max-w-xl rounded-lg border border-border bg-surface-secondary px-6 py-10">
          <Button href="/products" variant="dark">
            Explore products
          </Button>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {wishlist.items.map((item) => {
            const image = item.product.images[0];
            const variant = displayVariant(item);
            const available = inStockVariants(item);
            const single = available.length === 1 ? available[0] : null;
            const discount = variant?.price
              ? getDiscountPercent(variant.price, variant.compareAtPrice)
              : null;

            return (
              <li
                key={item.id}
                className="grid gap-4 py-5 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:items-center"
              >
                <Link
                  href={`/products/${item.product.slug}`}
                  className="relative block aspect-square overflow-hidden rounded-md bg-surface-secondary"
                >
                  <ProductImage
                    src={image?.url}
                    alt={image?.alt ?? item.product.name}
                    fill
                    sizes="104px"
                    className="object-cover"
                  />
                </Link>
                <div className="min-w-0">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="text-h3 transition-colors hover:text-primary"
                  >
                    {item.product.name}
                  </Link>
                  {variant?.price ? (
                    <PriceDisplay
                      className="mt-2"
                      price={variant.price}
                      compareAtPrice={variant.compareAtPrice}
                      discountPercent={discount}
                    />
                  ) : (
                    <p className="text-body-sm mt-2 text-foreground-muted">
                      Price unavailable
                    </p>
                  )}
                  <p className="text-body-sm mt-2 font-medium">
                    {item.purchasable ? "In stock" : "Out of stock"}
                  </p>
                  {single && variantLabel(single) ? (
                    <p className="text-body-sm mt-1 text-foreground-muted">
                      {variantLabel(single)}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <WishlistButton
                    productId={item.productId}
                    saved
                    returnTo="/wishlist"
                  />
                  {single ? (
                    <div className="min-w-40">
                      <AddToCartButton
                        variantId={single.id}
                        returnTo="/wishlist"
                        productName={item.product.name}
                        price={single.price ?? variant?.price ?? "0"}
                      />
                    </div>
                  ) : available.length > 1 ? (
                    <Button
                      href={`/products/${item.product.slug}`}
                      variant="secondary"
                      size="sm"
                    >
                      Choose options
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function WishlistSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-20 rounded bg-surface-secondary" />
      <div className="mt-4 h-10 w-40 rounded bg-surface-secondary" />
      <div className="mt-8 space-y-4">
        <div className="h-28 rounded-md bg-surface-secondary" />
        <div className="h-28 rounded-md bg-surface-secondary" />
      </div>
    </div>
  );
}

export default function WishlistPage(props: WishlistPageProps) {
  return (
    <main className="container-page flex-1 py-8 md:py-12">
      <Suspense fallback={<WishlistSkeleton />}>
        <AccountFrame>
          <WishlistContent {...props} />
        </AccountFrame>
      </Suspense>
    </main>
  );
}
