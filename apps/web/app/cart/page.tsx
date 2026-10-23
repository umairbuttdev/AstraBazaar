import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { moveCartItemToWishlistAction } from "@/app/cart/actions";
import { TrackView } from "@/components/analytics/track-view";
import { QuantityControls, RemoveCartItem } from "@/components/cart/quantity-controls";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { getCart } from "@/lib/cart-api";
import type { CartVariant } from "@/lib/cart-types";
import { formatMoney } from "@/lib/product-pricing";

export const metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

type CartPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

function attributeLines(variant: CartVariant) {
  const attributes = variant.attributes;
  if (attributes && typeof attributes === "object" && !Array.isArray(attributes)) {
    const lines = Object.entries(attributes).filter(
      (entry): entry is [string, string | number] =>
        typeof entry[1] === "string" || typeof entry[1] === "number",
    );
    if (lines.length > 0) {
      return lines.map(
        ([key, value]) =>
          `${key.charAt(0).toUpperCase()}${key.slice(1)}: ${value}`,
      );
    }
  }
  return [variant.name ?? variant.sku];
}

async function CartContent({ searchParams }: CartPageProps) {
  await connection();
  const params = await searchParams;
  let cart: Awaited<ReturnType<typeof getCart>> = null;
  let failed = false;

  try {
    cart = await getCart();
  } catch {
    failed = true;
  }

  if (failed) {
    return (
      <div className="max-w-xl">
        <p className="text-caption text-primary">Cart</p>
        <h1 className="text-h1 mt-3">Your cart</h1>
        <p className="text-body mt-4 text-foreground-muted">
          We couldn&apos;t load your cart. Please try again.
        </p>
        <Button href="/cart" className="mt-8" variant="dark">
          Retry
        </Button>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="max-w-xl">
        <p className="text-caption text-primary">Cart</p>
        <h1 className="text-h1 mt-3">Your cart</h1>
        <p className="text-body mt-4 text-foreground-muted">
          Login to view and manage your cart.
        </p>
        <Button href="/login?next=%2Fcart" className="mt-8" variant="dark">
          Login
        </Button>
      </div>
    );
  }

  const ready = cart.items.length > 0 && cart.items.every((item) => item.purchasable);

  return (
    <>
      <TrackView
        name="cart_viewed"
        onceKey="cart"
        properties={{ itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0) }}
      />
      <div className="max-w-xl">
        <p className="text-caption text-primary">Cart</p>
        <h1 className="text-h1 mt-3">Your cart</h1>
        <p className="text-body mt-4 text-foreground-muted">
          {cart.items.length === 0
            ? "Looks like you haven't added anything yet."
            : `${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"} in your cart.`}
        </p>
      </div>

      {params.error ? (
        <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {params.error}
        </p>
      ) : null}
      {params.message ? (
        <p className="mt-6 border border-border bg-surface-secondary px-4 py-3 text-sm text-foreground" role="status">
          {params.message}
        </p>
      ) : null}

      {cart.items.length === 0 ? (
        <div className="mt-10 max-w-xl rounded-lg border border-border bg-surface-secondary px-6 py-10">
          <p className="text-body text-foreground-muted">Your cart is empty.</p>
          <Button href="/products" className="mt-6" variant="dark">
            Explore products
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <ul className="divide-y divide-border border-y border-border">
            {cart.items.map((item) => {
              const image = item.variant.product.images[0];
              return (
                <li key={item.id} className="grid gap-4 py-5 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
                  <Link
                    href={`/products/${item.variant.product.slug}?variant=${item.variant.id}`}
                    className="relative block aspect-square overflow-hidden rounded-md bg-surface-secondary"
                  >
                    <ProductImage
                      src={image?.url}
                      alt={image?.alt ?? item.variant.product.name}
                      fill
                      sizes="104px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/products/${item.variant.product.slug}?variant=${item.variant.id}`}
                          className="text-h3 transition-colors hover:text-primary"
                        >
                          {item.variant.product.name}
                        </Link>
                        <ul className="text-body-sm mt-1 text-foreground-muted">
                          {attributeLines(item.variant).map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-price shrink-0">{formatMoney(item.lineTotal)}</p>
                    </div>
                    <p className="text-body-sm mt-2 text-foreground-muted">
                      {formatMoney(item.variant.price)} each
                    </p>
                    {item.notice ? (
                      <p className="text-body-sm mt-2 font-medium text-red-700">{item.notice}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <QuantityControls item={item} />
                      <RemoveCartItem itemId={item.id} variantId={item.variantId} />
                      <form action={moveCartItemToWishlistAction}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <button
                          type="submit"
                          className="text-sm text-foreground-muted underline underline-offset-4 hover:text-foreground"
                        >
                          Move to wishlist
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit rounded-lg border border-border bg-surface-secondary p-5 lg:sticky lg:top-36">
            <h2 className="text-h3">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-foreground-muted">Subtotal</dt>
                <dd className="font-semibold">{formatMoney(cart.subtotal)}</dd>
              </div>
            </dl>
            <p className="text-body-sm mt-4 text-foreground-muted">
              Shipping and tax are confirmed at checkout.
            </p>
            {ready ? (
              <Button href="/checkout" className="mt-6 w-full" variant="dark">
                Proceed to checkout
              </Button>
            ) : (
              <p className="text-body-sm mt-6 text-foreground">
                Update unavailable items before checkout.
              </p>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function CartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-16 rounded bg-surface-secondary" />
      <div className="mt-4 h-10 w-48 rounded bg-surface-secondary" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <div className="h-28 rounded-md bg-surface-secondary" />
          <div className="h-28 rounded-md bg-surface-secondary" />
        </div>
        <div className="h-48 rounded-lg bg-surface-secondary" />
      </div>
    </div>
  );
}

export default function CartPage(props: CartPageProps) {
  return (
    <main className="container-page flex-1 py-8 md:py-12">
      <Suspense fallback={<CartSkeleton />}>
        <CartContent {...props} />
      </Suspense>
    </main>
  );
}
