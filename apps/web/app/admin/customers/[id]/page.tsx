import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { adminGetCustomer } from "@/lib/admin-api";
import { formatOrderDate, formatOrderMoney, orderStatusLabel } from "@/lib/order-types";

async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  let customer;
  try {
    customer = await adminGetCustomer(id);
  } catch (error) {
    if (error instanceof Error && error.message === "Customer not found") notFound();
    return (
      <div>
        <h1 className="text-2xl font-semibold">Customer</h1>
        <p className="mt-3 text-sm text-ink-soft">Unable to load this customer.</p>
        <Link href={`/admin/customers/${id}`} className="mt-4 inline-flex text-sm font-semibold underline">Retry</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="text-sm underline underline-offset-4">Back to customers</Link>
      <header>
        <h1 className="text-2xl font-semibold">{customer.fullName || customer.email}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {customer.email} · {customer.role.toLowerCase()} · {customer._count.orders} orders · joined {formatOrderDate(customer.createdAt)}
        </p>
      </header>
      <section className="rounded-xl border border-ink/10 bg-foam p-4">
        <h2 className="font-semibold">Addresses</h2>
        {customer.addresses.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No saved addresses.</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {customer.addresses.map((address) => (
              <li key={address.id}>
                <p className="font-semibold">
                  {address.label || "Address"}
                  {address.isDefault ? " · Default" : ""}
                </p>
                <p className="text-ink-soft">
                  {address.fullName}, {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city}
                  {address.state ? `, ${address.state}` : ""} {address.postalCode}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="overflow-x-auto rounded-xl border border-ink/10 bg-foam">
        <h2 className="px-4 py-3 font-semibold">Recent orders</h2>
        {customer.orders.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-ink-soft">No orders.</p>
        ) : (
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-y border-ink/10 text-xs text-ink-soft uppercase">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Payment</th>
                <th className="px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((order) => (
                <tr key={order.id} className="border-b border-ink/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold underline-offset-4 hover:underline">
                      {order.id.slice(-8).toUpperCase()}
                    </Link>
                    <p className="text-xs text-ink-soft">{formatOrderDate(order.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">{orderStatusLabel(order.status)}</td>
                  <td className="px-4 py-3">{order.paymentStatus.toLowerCase()}</td>
                  <td className="px-4 py-3">{formatOrderMoney(order.total, order.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default function AdminCustomerPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading customer...</p>}>
      <CustomerDetail {...props} />
    </Suspense>
  );
}
