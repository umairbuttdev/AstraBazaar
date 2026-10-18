import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { placeOrderAction } from "@/app/checkout/actions";
import { getCart } from "@/lib/cart-api";
import { createClient } from "@/lib/supabase/server";

type CheckoutPageProps = {
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

async function CheckoutContent({ searchParams }: CheckoutPageProps) {
  await connection();
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cart = await getCart();

  if (!cart || !user) {
    return (
      <div className="max-w-xl">
        <p className="text-sm tracking-[0.2em] text-copper uppercase">
          Checkout
        </p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          Checkout
        </h1>
        <p className="mt-4 text-ink-soft">
          Login to complete your order.
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

  if (cart.items.length === 0) {
    return (
      <div className="max-w-xl">
        <p className="text-sm tracking-[0.2em] text-copper uppercase">
          Checkout
        </p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          Checkout
        </h1>
        <p className="mt-4 text-ink-soft">Your cart is empty.</p>
        <Link
          href="/#catalog"
          className="mt-8 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam transition-colors hover:bg-copper"
        >
          Browse catalog
        </Link>
      </div>
    );
  }

  const total = cart.items.reduce((sum, item) => {
    return sum + Number(item.variant.price) * item.quantity;
  }, 0);

  return (
    <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <p className="text-sm tracking-[0.2em] text-copper uppercase">
          Checkout
        </p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          Shipping details
        </h1>
        <p className="mt-4 max-w-md text-ink-soft">
          Confirm your address to place the order. Payment integration comes
          next — for now orders are confirmed immediately.
        </p>

        {params.error ? (
          <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {params.error}
          </p>
        ) : null}

        <form action={placeOrderAction} className="mt-10 space-y-5">
          <label className="block">
            <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
              Email
            </span>
            <input
              type="email"
              name="email"
              required
              defaultValue={user.email ?? ""}
              className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
            />
          </label>

          <label className="block">
            <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
              Full name
            </span>
            <input
              type="text"
              name="fullName"
              required
              defaultValue={
                typeof user.user_metadata?.full_name === "string"
                  ? user.user_metadata.full_name
                  : ""
              }
              className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
            />
          </label>

          <label className="block">
            <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
              Address
            </span>
            <input
              type="text"
              name="line1"
              required
              className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
            />
          </label>

          <label className="block">
            <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
              Apartment, suite (optional)
            </span>
            <input
              type="text"
              name="line2"
              className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
                City
              </span>
              <input
                type="text"
                name="city"
                required
                className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
              />
            </label>
            <label className="block">
              <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
                State
              </span>
              <input
                type="text"
                name="state"
                className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
                Postal code
              </span>
              <input
                type="text"
                name="postalCode"
                required
                className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
              />
            </label>
            <label className="block">
              <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
                Country
              </span>
              <input
                type="text"
                name="country"
                defaultValue="US"
                required
                className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
              Phone (optional)
            </span>
            <input
              type="tel"
              name="phone"
              className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
            />
          </label>

          <button
            type="submit"
            className="bg-ink px-6 py-3 text-sm font-semibold tracking-wide text-foam transition-colors hover:bg-copper"
          >
            Place order
          </button>
        </form>
      </div>

      <aside className="border-t border-ink/10 pt-8 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
        <h2 className="font-display text-2xl text-ink">Order summary</h2>
        <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
          {cart.items.map((item) => {
            const lineTotal = Number(item.variant.price) * item.quantity;
            return (
              <li key={item.id} className="flex justify-between gap-4 py-4">
                <div>
                  <p className="text-ink">{item.variant.product.name}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {item.variant.name ?? item.variant.sku} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-ink">
                  {formatPrice(lineTotal.toFixed(2))}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-xl font-semibold text-ink">
          Total {formatPrice(total.toFixed(2))}
        </p>
        <Link
          href="/cart"
          className="mt-4 inline-block text-sm text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
        >
          Edit cart
        </Link>
      </aside>
    </div>
  );
}

export default function CheckoutPage(props: CheckoutPageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 md:px-10">
      <Suspense fallback={<p className="text-ink-soft">Loading checkout...</p>}>
        <CheckoutContent {...props} />
      </Suspense>
    </main>
  );
}
