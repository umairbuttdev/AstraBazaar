import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountFrame } from "@/components/account/account-frame";
import { OrderSummaryCard } from "@/components/orders/order-summary-card";
import { listOrders } from "@/lib/checkout-api";
import type { OrderList } from "@/lib/order-types";

export const metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

type OrdersPageProps = {
  searchParams: Promise<{
    filter?: string;
    page?: string;
    error?: string;
    message?: string;
  }>;
};

type OrdersFilter = "all" | "active" | "completed" | "cancelled";

function parseFilter(value?: string): OrdersFilter {
  if (
    value === "active" ||
    value === "completed" ||
    value === "cancelled" ||
    value === "all"
  ) {
    return value;
  }
  return "all";
}

function pageHref(filter: OrdersFilter, page: number) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/orders?${query}` : "/orders";
}

async function OrdersContent({ searchParams }: OrdersPageProps) {
  await connection();
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const page = Math.max(1, Number(params.page) || 1);

  let orders: OrderList | null = null;
  let loadError: string | null = null;
  try {
    orders = await listOrders({ page, filter });
  } catch {
    loadError = "Unable to load your orders right now.";
  }

  if (loadError) {
    return (
      <div className="max-w-xl">
        <h2 className="font-display text-4xl text-ink">Your orders</h2>
        <p className="mt-4 text-ink-soft">{loadError}</p>
        <Link
          href={pageHref(filter, page)}
          className="mt-8 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Try again
        </Link>
      </div>
    );
  }

  if (!orders) {
    return (
      <div className="max-w-xl">
        <p className="text-sm tracking-[0.2em] text-copper uppercase">Orders</p>
        <h2 className="mt-3 font-display text-4xl text-ink">Your orders</h2>
        <p className="mt-4 text-ink-soft">Login to view your orders.</p>
        <Link
          href={`/login?next=${encodeURIComponent(pageHref(filter, page))}`}
          className="mt-8 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Login
        </Link>
      </div>
    );
  }

  const chips: Array<{ id: OrdersFilter; label: string; count: number }> = [
    { id: "all", label: "All", count: orders.counts.all },
    { id: "active", label: "Active", count: orders.counts.active },
    { id: "completed", label: "Delivered", count: orders.counts.completed },
    { id: "cancelled", label: "Cancelled", count: orders.counts.cancelled },
  ];

  return (
    <>
      <div className="mb-8 max-w-2xl">
        <p className="text-sm tracking-[0.2em] text-copper uppercase">Account</p>
        <h2 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          Your orders
        </h2>
        <p className="mt-4 text-ink-soft">
          See what you ordered, how you paid, and where each order stands.
        </p>
      </div>

      {params.error ? (
        <p className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {params.error}
        </p>
      ) : null}
      {params.message ? (
        <p className="mb-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {params.message}
        </p>
      ) : null}

      <div className="mb-8 flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = chip.id === filter;
          return (
            <Link
              key={chip.id}
              href={pageHref(chip.id, 1)}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                active
                  ? "bg-ink text-foam"
                  : "border border-ink/10 bg-foam text-ink-soft hover:border-copper hover:text-ink"
              }`}
            >
              {chip.label}
              <span className="sr-only"> orders</span>
              <span aria-hidden> ({chip.count})</span>
            </Link>
          );
        })}
      </div>

      {orders.counts.all === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink/15 bg-foam px-6 py-14 text-center">
          <h2 className="font-display text-3xl text-ink">No orders yet</h2>
          <p className="mt-3 text-ink-soft">
            When you place an order, it will appear here.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
          >
            Start shopping
          </Link>
        </div>
      ) : orders.items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink/15 bg-foam px-6 py-12 text-center">
          <p className="text-ink-soft">No orders in this view.</p>
          <Link
            href="/orders"
            className="mt-6 inline-flex text-sm font-semibold text-ink underline underline-offset-4"
          >
            View all orders
          </Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {orders.items.map((order) => (
            <li key={order.id}>
              <OrderSummaryCard order={order} />
            </li>
          ))}
        </ul>
      )}

      {orders.totalPages > 1 ? (
        <nav
          aria-label="Order pages"
          className="mt-8 flex items-center justify-between gap-4 text-sm"
        >
          {page > 1 ? (
            <Link
              href={pageHref(filter, page - 1)}
              className="font-semibold text-ink underline underline-offset-4"
            >
              Previous
            </Link>
          ) : (
            <span className="text-ink-soft">Previous</span>
          )}
          <p className="text-ink-soft">
            Page {orders.page} of {orders.totalPages}
          </p>
          {page < orders.totalPages ? (
            <Link
              href={pageHref(filter, page + 1)}
              className="font-semibold text-ink underline underline-offset-4"
            >
              Next
            </Link>
          ) : (
            <span className="text-ink-soft">Next</span>
          )}
        </nav>
      ) : null}
    </>
  );
}

export default function OrdersPage(props: OrdersPageProps) {
  return (
    <main className="container-page flex-1 py-8 md:py-12">
      <Suspense
        fallback={
          <div className="animate-pulse">
            <div className="h-4 w-20 rounded bg-mist" />
            <div className="mt-4 h-10 w-48 rounded bg-mist" />
            <div className="mt-8 h-40 rounded-3xl bg-mist" />
            <p className="mt-4 text-sm text-ink-soft">Loading orders...</p>
          </div>
        }
      >
        <AccountFrame>
          <OrdersContent {...props} />
        </AccountFrame>
      </Suspense>
    </main>
  );
}
