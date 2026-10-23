import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { deleteAdminOrderAction } from "@/app/admin/actions";
import { AdminPager } from "@/components/admin/admin-pager";
import { DeleteOrderButton } from "@/components/admin/order-actions";
import { adminListOrders } from "@/lib/admin-api";
import {
  formatOrderDate,
  formatOrderMoney,
  orderStatusLabel,
  paymentStatusLabel,
  type OrderStatus,
} from "@/lib/order-types";

const statuses = ["open", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "FULFILLED", "CANCELLED"];

function listHref(query: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const text = params.toString();
  return text ? `/admin/orders?${text}` : "/admin/orders";
}

async function OrdersContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  let orders = null;
  try {
    orders = await adminListOrders({
      page,
      q: params.q,
      status: params.status,
      paymentStatus: params.paymentStatus,
    });
  } catch {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="mt-3 text-sm text-ink-soft">Unable to load orders.</p>
        <Link href="/admin/orders" className="mt-4 inline-flex text-sm font-semibold underline">Retry</Link>
      </div>
    );
  }

  const query = { q: params.q, status: params.status, paymentStatus: params.paymentStatus };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>
      <p className="mt-1 text-sm text-ink-soft">{orders.total} in this view</p>
      {params.error ? <p className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{params.error}</p> : null}
      {params.message ? <p className="mt-4 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{params.message}</p> : null}
      <form className="mt-4 grid gap-3 md:grid-cols-4">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Order, name, email, or phone" className="rounded-md border border-ink/15 bg-foam px-3 py-2 text-sm md:col-span-2" />
        <select name="status" defaultValue={params.status ?? ""} className="rounded-md border border-ink/15 bg-foam px-3 py-2 text-sm">
          <option value="">Any fulfillment</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status === "open" ? "Open" : orderStatusLabel(status as OrderStatus)}
            </option>
          ))}
        </select>
        <select name="paymentStatus" defaultValue={params.paymentStatus ?? ""} className="rounded-md border border-ink/15 bg-foam px-3 py-2 text-sm">
          <option value="">Any payment</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
        </select>
        <button className="bg-ink px-4 py-2 text-sm font-semibold text-foam md:w-fit">Search</button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl border border-ink/10 bg-foam">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Items</th>
              <th className="px-4 py-2">Payment</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-ink-soft">No orders in this view.</td></tr>
            ) : orders.items.map((order) => (
              <tr key={order.id} className="border-b border-ink/5">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold underline-offset-4 hover:underline">
                    {order.id.slice(-8).toUpperCase()}
                  </Link>
                  <p className="text-xs text-ink-soft">{formatOrderDate(order.createdAt)}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{order.fullName}</p>
                  <p className="text-xs text-ink-soft">{order.email}</p>
                </td>
                <td className="px-4 py-3">{order.lineCount ?? order.items.length}</td>
                <td className="px-4 py-3">{paymentStatusLabel(order) ?? order.paymentStatus}</td>
                <td className="px-4 py-3">{orderStatusLabel(order.status)}</td>
                <td className="px-4 py-3">{formatOrderMoney(order.total, order.currency)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-sm font-semibold text-ink underline underline-offset-4"
                    >
                      View
                    </Link>
                    <DeleteOrderButton
                      orderId={order.id}
                      action={deleteAdminOrderAction}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPager page={orders.page} totalPages={orders.totalPages} href={(next) => listHref(query, next)} />
    </div>
  );
}

export default function AdminOrdersPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading orders...</p>}>
      <OrdersContent {...props} />
    </Suspense>
  );
}
