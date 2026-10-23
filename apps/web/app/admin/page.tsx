import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { adminGetDashboard } from "@/lib/admin-api";
import { formatOrderDate, formatOrderMoney, orderStatusLabel } from "@/lib/order-types";

const ranges = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "all", label: "All" },
] as const;

async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const range = ranges.some((item) => item.id === params.range) ? params.range : "7d";
  let data = null;
  try {
    data = await adminGetDashboard(range);
  } catch {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-3 text-sm text-ink-soft">Unable to load operations data.</p>
        <Link href="/admin" className="mt-4 inline-flex text-sm font-semibold underline">
          Retry
        </Link>
      </div>
    );
  }

  const alerts = [
    {
      href: "/admin/orders?status=open",
      label: "Orders still open",
      value: data.openOrders,
    },
    {
      href: "/admin/inventory?stock=low",
      label: "Low stock variants",
      value: data.lowStock,
    },
    {
      href: "/admin/inventory?stock=out",
      label: "Out of stock",
      value: data.outOfStock,
    },
    {
      href: "/admin/orders?paymentStatus=FAILED",
      label: "Failed payments",
      value: data.failedPayments,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">What needs attention</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Counts are current. Order value covers the selected period and excludes cancelled orders.
          </p>
        </div>
        <nav aria-label="Date range" className="flex flex-wrap gap-2">
          {ranges.map((item) => (
            <Link
              key={item.id}
              href={item.id === "7d" ? "/admin" : `/admin?range=${item.id}`}
              aria-current={range === item.id ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                range === item.id ? "bg-ink text-foam" : "border border-ink/10 bg-foam"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-ink/10 bg-foam p-4">
          <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Placed order value</p>
          <p className="mt-2 text-2xl font-semibold">{formatOrderMoney(data.orderValue, data.currency)}</p>
          <p className="mt-1 text-sm text-ink-soft">{data.orderCount} orders in this range</p>
        </div>
        {alerts.map((alert) => (
          <Link key={alert.href} href={alert.href} className="rounded-xl border border-ink/10 bg-foam p-4 hover:border-copper">
            <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{alert.label}</p>
            <p className="mt-2 text-2xl font-semibold">{alert.value}</p>
            <p className="mt-1 text-sm font-semibold text-ink">Open</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-foam">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold underline underline-offset-4">
              All orders
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-ink-soft">No orders yet.</p>
          ) : (
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-y border-ink/10 text-xs text-ink-soft uppercase">
                <tr>
                  <th className="px-4 py-2 font-semibold">Order</th>
                  <th className="px-4 py-2 font-semibold">Customer</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-ink/5">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold underline-offset-4 hover:underline">
                        {order.id.slice(-8).toUpperCase()}
                      </Link>
                      <p className="text-xs text-ink-soft">{formatOrderDate(order.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{order.fullName}</p>
                      <p className="text-xs text-ink-soft">{order.itemCount} lines</p>
                    </td>
                    <td className="px-4 py-3">{orderStatusLabel(order.status)}</td>
                    <td className="px-4 py-3">{formatOrderMoney(order.total, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <aside className="rounded-xl border border-ink/10 bg-foam p-4">
          <h2 className="font-semibold">Catalog</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(data.productsByStatus).map(([status, count]) => (
              <li key={status} className="flex justify-between gap-4">
                <Link href={`/admin/products?status=${status}`} className="underline-offset-4 hover:underline">
                  {status.toLowerCase()}
                </Link>
                <span>{count}</span>
              </li>
            ))}
          </ul>
          <h2 className="mt-6 font-semibold">Order status</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(data.ordersByStatus).map(([status, count]) => (
              <li key={status} className="flex justify-between gap-4">
                <Link href={`/admin/orders?status=${status}`} className="underline-offset-4 hover:underline">
                  {orderStatusLabel(status as "PENDING")}
                </Link>
                <span>{count}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}

export default function AdminHomePage(props: {
  searchParams: Promise<{ range?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading dashboard...</p>}>
      <DashboardContent {...props} />
    </Suspense>
  );
}
