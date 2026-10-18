import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  removeCartItemAction,
  updateCartItemAction,
} from "@/app/cart/actions";
import { ProductImage } from "@/components/product-image";
import { getCart } from "@/lib/cart-api";

type CartPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function formatPrice(value: string) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

async function CartContent({ searchParams }: CartPageProps) {
  await connection();
  const params = await searchParams;
  const cart = await getCart();

  if (!cart) {
    return (
      <div className="max-w-xl">
        <p className="text-sm tracking-[0.2em] text-copper uppercase">Cart</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          Your cart
        </h1>
        <p className="mt-4 text-ink-soft">
          Login to view and manage your cart.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam transition-colors hover:bg-copper"
        >
          Login
        </Link>
      </div>
    );
  }

  const total = cart.items.reduce((sum, item) => {
    return sum + Number(item.variant.price) * item.quantity;
  }, 0);

  return (
    <>
      <div className="mb-10 max-w-xl">
        <p className="text-sm tracking-[0.2em] text-copper uppercase">Cart</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          Your cart
        </h1>
        <p className="mt-4 text-ink-soft">
          {cart.items.length === 0
            ? "Your cart is empty."
            : `${cart.items.length} line item${cart.items.length === 1 ? "" : "s"} ready for checkout.`}
        </p>
      </div>

      {params.error ? (
        <p className="mb-8 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {params.error}
        </p>
      ) : null}

      {cart.items.length === 0 ? (
        <Link
          href="/#catalog"
          className="inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam transition-colors hover:bg-copper"
        >
          Browse catalog
        </Link>
      ) : (
        <div className="space-y-8">
          <ul className="divide-y divide-ink/10 border-y border-ink/10">
            {cart.items.map((item) => {
              const image = item.variant.product.images[0];
              const lineTotal = Number(item.variant.price) * item.quantity;

              return (
                <li
                  key={item.id}
                  className="grid gap-6 py-6 md:grid-cols-[120px_1fr_auto]"
                >
                  <div className="relative aspect-square overflow-hidden bg-mist">
                    <ProductImage
                      src={image?.url}
                      alt={image?.alt ?? item.variant.product.name}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <Link
                      href={`/products/${item.variant.product.slug}`}
                      className="font-display text-2xl text-ink transition-colors hover:text-copper"
                    >
                      {item.variant.product.name}
                    </Link>
                    <p className="mt-1 text-sm text-ink-soft">
                      {item.variant.name ?? item.variant.sku}
                    </p>
                    <p className="mt-2 text-sm text-ink">
                      {formatPrice(item.variant.price)} each
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <form action={updateCartItemAction} className="flex items-center gap-2">
                        <input type="hidden" name="itemId" value={item.id} />
                        <label className="text-sm text-ink-soft">
                          Qty
                          <input
                            type="number"
                            name="quantity"
                            min={1}
                            defaultValue={item.quantity}
                            className="ml-2 w-20 border border-ink/15 bg-foam px-2 py-1 text-ink"
                          />
                        </label>
                        <button
                          type="submit"
                          className="text-sm text-ink underline underline-offset-4"
                        >
                          Update
                        </button>
                      </form>

                      <form action={removeCartItemAction}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <button
                          type="submit"
                          className="text-sm text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>

                  <p className="font-semibold text-ink md:text-right">
                    {formatPrice(lineTotal.toFixed(2))}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xl font-semibold text-ink">
              Total {formatPrice(total.toFixed(2))}
            </p>
            <Link
              href="/checkout"
              className="inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam transition-colors hover:bg-copper"
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default function CartPage(props: CartPageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 md:px-10">
      <Suspense fallback={<p className="text-ink-soft">Loading cart...</p>}>
        <CartContent {...props} />
      </Suspense>
    </main>
  );
}
