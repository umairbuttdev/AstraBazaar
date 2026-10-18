import Link from "next/link";
import { Suspense } from "react";
import { OrderCard } from "@/components/order-card";
import { adminListOrders } from "@/lib/admin-api";
import { isActiveOrderStatus, type Order } from "@/lib/order-types";

type AdminOrdersPageProps = {
  searchParams: Promise<{
    filter?: string;
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

function filterOrders(orders: Order[], filter: OrdersFilter) {
  switch (filter) {
    case "active":
      return orders.filter((order) => isActiveOrderStatus(order.status));
    case "completed":
      return orders.filter((order) => order.status === "FULFILLED");
    case "cancelled":
      return orders.filter((order) => order.status === "CANCELLED");
    default:
      return orders;
  }
}

function countByFilter(orders: Order[]) {
  return {
    all: orders.length,
    active: orders.filter((order) => isActiveOrderStatus(order.status)).length,
    completed: orders.filter((order) => order.status === "FULFILLED").length,
    cancelled: orders.filter((order) => order.status === "CANCELLED").length,
  };
}

async function OrdersContent({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const orders = await adminListOrders();
  const counts = countByFilter(orders);
  const visible = filterOrders(orders, filter);

  const chips: Array<{ id: OrdersFilter; label: string; count: number }> = [
    { id: "all", label: "All", count: counts.all },
    { id: "active", label: "Active", count: counts.active },
    { id: "completed", label: "Completed", count: counts.completed },
    { id: "cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <h2 className="font-display text-2xl text-ink md:text-3xl">
          Manage store orders
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Same order cards as customers — update status from the detail page.
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
              href={`/admin/orders?filter=${chip.id}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-ink text-foam"
                  : "border border-ink/10 bg-foam text-ink-soft hover:border-copper hover:text-ink"
              }`}
            >
              {chip.label} ({chip.count})
            </Link>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink/15 bg-foam/50 px-6 py-12 text-center">
          <p className="text-ink-soft">No orders in this filter.</p>
        </div>
      ) : (
        <ul className="space-y-5">
          {visible.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} mode="admin" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminOrdersPage(props: AdminOrdersPageProps) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading orders...</p>}>
      <OrdersContent {...props} />
    </Suspense>
  );
}
