import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { listOrders } from "@/lib/checkout-api";

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function OrdersContent() {
  await connection();
  const orders = await listOrders();

  if (!orders) {
    return (
      <div className="max-w-xl">
        <p className="text-sm tracking-[0.2em] text-copper uppercase">Orders</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          Your orders
        </h1>
        <p className="mt-4 text-ink-soft">Login to view your orders.</p>
        <Link
          href="/login"
          className="mt-8 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam transition-colors hover:bg-copper"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-10 max-w-xl">
        <p className="text-sm tracking-[0.2em] text-copper uppercase">Orders</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          Your orders
        </h1>
        <p className="mt-4 text-ink-soft">
          {orders.length === 0
            ? "No orders yet."
            : `${orders.length} order${orders.length === 1 ? "" : "s"} placed.`}
        </p>
      </div>

      {orders.length === 0 ? (
        <Link
          href="/#catalog"
          className="inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam transition-colors hover:bg-copper"
        >
          Browse catalog
        </Link>
      ) : (
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={`/orders/${order.id}`}
                  className="font-display text-2xl text-ink transition-colors hover:text-copper"
                >
                  Order {order.id.slice(-8)}
                </Link>
                <p className="mt-1 text-sm text-ink-soft">
                  {formatDate(order.createdAt)} · {order.status.toLowerCase()} ·{" "}
                  {order.items.length} item
                  {order.items.length === 1 ? "" : "s"}
                </p>
              </div>
              <p className="font-semibold text-ink">
                {formatPrice(order.total)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 md:px-10">
      <Suspense fallback={<p className="text-ink-soft">Loading orders...</p>}>
        <OrdersContent />
      </Suspense>
    </main>
  );
}
