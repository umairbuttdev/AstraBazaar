import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { adminGetOrder } from "@/lib/admin-api";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
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

async function OrderDetail({ params, searchParams }: OrderDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;

  let order;
  try {
    order = await adminGetOrder(id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/orders"
        className="text-sm text-ink-soft underline underline-offset-4"
      >
        Back to orders
      </Link>
      <h2 className="mt-4 font-display text-2xl text-ink">
        Order {order.id.slice(-8)}
      </h2>
      <p className="mt-2 text-sm text-ink-soft">
        {order.fullName} · {order.email}
      </p>

      {query.error ? (
        <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {query.error}
        </p>
      ) : null}
      {query.message ? (
        <p className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {query.message}
        </p>
      ) : null}

      <form
        action={updateOrderStatusAction}
        className="mt-8 flex flex-wrap items-end gap-3"
      >
        <input type="hidden" name="id" value={order.id} />
        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Status
          </span>
          <select
            name="status"
            defaultValue={order.status}
            className="mt-2 block border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
          >
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <button
          type="submit"
          className="bg-ink px-5 py-3 text-sm font-semibold text-foam transition-colors hover:bg-copper"
        >
          Update status
        </button>
      </form>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-xl text-ink">Items</h3>
          <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-4">
                <div>
                  <p className="text-ink">{item.productName}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {item.variantName ?? item.sku} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-ink">
                  {formatPrice(
                    (Number(item.unitPrice) * item.quantity).toFixed(2),
                  )}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xl font-semibold text-ink">
            Total {formatPrice(order.total)}
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl text-ink">Ship to</h3>
          <div className="mt-4 space-y-1 text-ink-soft">
            <p className="text-ink">{order.fullName}</p>
            <p>{order.line1}</p>
            {order.line2 ? <p>{order.line2}</p> : null}
            <p>
              {order.city}
              {order.state ? `, ${order.state}` : ""} {order.postalCode}
            </p>
            <p>{order.country}</p>
            {order.phone ? <p className="pt-2">{order.phone}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage(props: OrderDetailPageProps) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading order...</p>}>
      <OrderDetail {...props} />
    </Suspense>
  );
}
