import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getOrder } from "@/lib/checkout-api";

type OrderPageProps = {
  params: Promise<{ id: string }>;
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

async function OrderContent({ params }: OrderPageProps) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  return (
    <>
      <div className="mb-10 max-w-xl">
        <p className="text-sm tracking-[0.2em] text-copper uppercase">Order</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          Order confirmed
        </h1>
        <p className="mt-4 text-ink-soft">
          Thanks, {order.fullName}. Your order is{" "}
          <span className="text-ink">{order.status.toLowerCase()}</span>.
        </p>
        <p className="mt-2 text-sm text-ink-soft">Order ID: {order.id}</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl text-ink">Items</h2>
          <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {order.items.map((item) => {
              const lineTotal = Number(item.unitPrice) * item.quantity;
              return (
                <li key={item.id} className="flex justify-between gap-4 py-4">
                  <div>
                    <p className="text-ink">{item.productName}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {item.variantName ?? item.sku} × {item.quantity}
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
            Total {formatPrice(order.total)}
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl text-ink">Shipping to</h2>
          <div className="mt-4 space-y-1 text-ink-soft">
            <p className="text-ink">{order.fullName}</p>
            <p>{order.line1}</p>
            {order.line2 ? <p>{order.line2}</p> : null}
            <p>
              {order.city}
              {order.state ? `, ${order.state}` : ""} {order.postalCode}
            </p>
            <p>{order.country}</p>
            <p className="pt-2">{order.email}</p>
            {order.phone ? <p>{order.phone}</p> : null}
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href="/#catalog"
          className="inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam transition-colors hover:bg-copper"
        >
          Continue shopping
        </Link>
        <Link
          href="/orders"
          className="inline-flex border border-ink/20 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-copper hover:text-copper"
        >
          View orders
        </Link>
      </div>
    </>
  );
}

export default function OrderPage(props: OrderPageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 md:px-10">
      <Suspense fallback={<p className="text-ink-soft">Loading order...</p>}>
        <OrderContent {...props} />
      </Suspense>
    </main>
  );
}
