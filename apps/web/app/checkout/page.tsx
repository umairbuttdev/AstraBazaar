import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Button } from "@/components/ui/button";
import {
  getCheckoutQuote,
  listCheckoutAddresses,
} from "@/lib/checkout-api";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

type CheckoutPageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function CheckoutContent({ searchParams }: CheckoutPageProps) {
  await connection();
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-xl">
        <p className="text-caption text-primary">Checkout</p>
        <h1 className="text-h1 mt-3">Checkout</h1>
        <p className="text-body mt-4 text-foreground-muted">
          Login to complete your order.
        </p>
        <Button href="/login?next=%2Fcheckout" className="mt-8" variant="dark">
          Login
        </Button>
      </div>
    );
  }

  let quote = null;
  let addresses: Awaited<ReturnType<typeof listCheckoutAddresses>> = [];
  try {
    quote = await getCheckoutQuote();
    addresses = (await listCheckoutAddresses()) ?? [];
  } catch {
    quote = null;
  }

  if (!quote) {
    return (
      <div className="max-w-xl">
        <p className="text-caption text-primary">Checkout</p>
        <h1 className="text-h1 mt-3">Checkout</h1>
        <p className="text-body mt-4 text-foreground-muted">
          We couldn&apos;t load checkout. Please try again.
        </p>
        <Button href="/checkout" className="mt-8" variant="dark">
          Retry
        </Button>
      </div>
    );
  }

  if (quote.items.length === 0) {
    return (
      <div className="max-w-xl">
        <p className="text-caption text-primary">Checkout</p>
        <h1 className="text-h1 mt-3">Checkout</h1>
        <p className="text-body mt-4 text-foreground-muted">
          Your cart is empty. Add something before checkout.
        </p>
        <Button href="/products" className="mt-8" variant="dark">
          Start shopping
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-xl">
        <p className="text-caption text-primary">Checkout</p>
        <h1 className="text-h1 mt-3">Checkout</h1>
        <p className="text-body mt-4 text-foreground-muted">
          Confirm the address, delivery, and payment. The order total is
          calculated again when you place the order.
        </p>
      </div>

      {params.error ? (
        <p
          className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {params.error}{" "}
          <Link href="/cart" className="font-semibold underline">
            Review cart
          </Link>
        </p>
      ) : null}

      <div className="mt-8">
        <CheckoutForm
          quote={quote}
          addresses={addresses}
          email={user.email ?? ""}
          fullName={
            typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : ""
          }
        />
      </div>
    </>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-24 rounded bg-surface-secondary" />
      <div className="mt-4 h-10 w-48 rounded bg-surface-secondary" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-80 rounded-lg bg-surface-secondary" />
        <div className="h-64 rounded-lg bg-surface-secondary" />
      </div>
    </div>
  );
}

export default function CheckoutPage(props: CheckoutPageProps) {
  return (
    <main className="container-page flex-1 py-8 pb-28 md:py-12 md:pb-12">
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutContent {...props} />
      </Suspense>
    </main>
  );
}
