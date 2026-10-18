import Link from "next/link";
import { Suspense } from "react";
import { adminListOrders } from "@/lib/admin-api";

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
  const orders = await adminListOrders();

  return (
    <>
      <div className="mb-8">
        <h2 className="font-display text-2xl text-ink">Orders</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {orders.length} order{orders.length === 1 ? "" : "s"}
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="text-ink-soft">No orders yet.</p>
      ) : (
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-display text-xl text-ink transition-colors hover:text-copper"
                >
                  {order.fullName}
                </Link>
                <p className="mt-1 text-sm text-ink-soft">
                  {formatDate(order.createdAt)} · {order.status.toLowerCase()} ·{" "}
                  {order.items.length} item
                  {order.items.length === 1 ? "" : "s"} · {order.email}
                </p>
              </div>
              <p className="font-semibold text-ink">{formatPrice(order.total)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading orders...</p>}>
      <OrdersContent />
    </Suspense>
  );
}
