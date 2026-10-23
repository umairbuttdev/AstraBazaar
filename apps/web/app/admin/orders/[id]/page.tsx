import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteAdminOrderAction, updateOrderStatusAction } from "@/app/admin/actions";
import { DeleteOrderButton } from "@/components/admin/order-actions";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { adminGetOrder } from "@/lib/admin-api";
import {
  formatOrderDate,
  formatOrderMoney,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  shippingMethodLabel,
} from "@/lib/order-types";

async function OrderDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  await connection();
  const { id } = await params;
  const query = await searchParams;
  let order;
  try {
    order = await adminGetOrder(id);
  } catch (error) {
    if (error instanceof Error && error.message === "Order not found") notFound();
    return (
      <div>
        <h1 className="text-2xl font-semibold">Order</h1>
        <p className="mt-3 text-sm text-ink-soft">Unable to load this order.</p>
        <Link href={`/admin/orders/${id}`} className="mt-4 inline-flex text-sm font-semibold underline">Retry</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="text-sm underline underline-offset-4">Back to orders</Link>
      <header>
        <h1 className="text-2xl font-semibold">Order {order.id}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {formatOrderDate(order.createdAt, true)} · {orderStatusLabel(order.status)} · {paymentStatusLabel(order)}
        </p>
      </header>
      {query.error ? <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{query.error}</p> : null}
      {query.message ? <p className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{query.message}</p> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-ink/10 bg-foam p-4">
          <h2 className="font-semibold">Customer</h2>
          <p className="mt-2">{order.fullName}</p>
          <p className="text-sm text-ink-soft">{order.email}</p>
          {order.phone ? <p className="text-sm text-ink-soft">{order.phone}</p> : null}
          {order.profile ? (
            <Link href={`/admin/customers/${order.profile.id}`} className="mt-3 inline-flex text-sm font-semibold underline">
              Customer profile
            </Link>
          ) : null}
        </div>
        <div className="rounded-xl border border-ink/10 bg-foam p-4">
          <h2 className="font-semibold">Payment</h2>
          <p className="mt-2 text-sm">{paymentMethodLabel(order.paymentMethod) ?? "Recorded on the order"}</p>
          <p className="text-sm text-ink-soft">{paymentStatusLabel(order)}</p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-foam p-4">
          <h2 className="font-semibold">Delivery</h2>
          <p className="mt-2 text-sm">{shippingMethodLabel(order.shippingMethod)}</p>
          <p className="text-sm text-ink-soft">{order.line1}</p>
          {order.line2 ? <p className="text-sm text-ink-soft">{order.line2}</p> : null}
          <p className="text-sm text-ink-soft">
            {order.city}{order.state ? `, ${order.state}` : ""} {order.postalCode} {order.country}
          </p>
          <p className="mt-2 text-sm text-ink-soft">No shipment or tracking number is stored for this order.</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-ink/10 bg-foam">
        <h2 className="px-4 py-3 font-semibold">Items</h2>
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-y border-ink/10 text-xs text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2">Unit</th>
              <th className="px-4 py-2">Line</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-ink/5">
                <td className="px-4 py-3">
                  <p>{item.productName}</p>
                  {item.variantName ? <p className="text-xs text-ink-soft">{item.variantName}</p> : null}
                </td>
                <td className="px-4 py-3">{item.sku}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{formatOrderMoney(item.unitPrice, order.currency)}</td>
                <td className="px-4 py-3">{formatOrderMoney((Number(item.unitPrice) * item.quantity).toFixed(2), order.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="space-y-1 px-4 py-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatOrderMoney(order.subtotal, order.currency)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd>{formatOrderMoney(order.shippingAmount ?? "0.00", order.currency)}</dd></div>
          <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatOrderMoney(order.total, order.currency)}</dd></div>
        </dl>
      </section>

      <section className="rounded-xl border border-ink/10 bg-foam p-4">
        <h2 className="font-semibold">Status history</h2>
        {order.statusHistory && order.statusHistory.length > 0 ? (
          <ol className="mt-3 space-y-3 text-sm">
            {order.statusHistory.map((event) => (
              <li key={event.id}>
                <p className="font-semibold">{orderStatusLabel(event.status)}</p>
                <time dateTime={event.createdAt} className="text-ink-soft">{formatOrderDate(event.createdAt, true)}</time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">No status history is recorded.</p>
        )}
        <p className="mt-4 text-sm text-ink-soft">
          Current status: {orderStatusLabel(order.status)}. The API accepts any status in the existing order set.
        </p>
        <OrderStatusForm orderId={order.id} status={order.status} action={updateOrderStatusAction} />
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h2 className="font-semibold text-red-950">Danger zone</h2>
        <p className="mt-2 text-sm text-red-900">
          Permanently remove this order and its line items from the database.
          Past receipts for the customer will no longer show it.
        </p>
        <div className="mt-3">
          <DeleteOrderButton
            orderId={order.id}
            label="Delete order from database"
            action={deleteAdminOrderAction}
          />
        </div>
      </section>
    </div>
  );
}

export default function AdminOrderDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading order...</p>}>
      <OrderDetail {...props} />
    </Suspense>
  );
}
