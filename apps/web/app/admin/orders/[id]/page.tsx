import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { OrderCard } from "@/components/order-card";
import { adminGetOrder } from "@/lib/admin-api";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

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
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/admin/orders"
        className="text-sm text-ink-soft underline underline-offset-4"
      >
        Back to orders
      </Link>

      <div className="mt-6 mb-8">
        <h2 className="font-display text-3xl text-ink md:text-4xl">
          Order details
        </h2>
        <p className="mt-3 text-ink-soft">
          Review the customer order card, then update fulfillment status.
        </p>
      </div>

      {query.error ? (
        <p className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {query.error}
        </p>
      ) : null}
      {query.message ? (
        <p className="mb-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {query.message}
        </p>
      ) : null}

      <OrderCard order={order} mode="admin" />

      <div className="mt-6 rounded-3xl border border-ink/10 bg-foam/80 p-5 md:p-6">
        <h3 className="font-display text-2xl text-ink">Update status</h3>
        <p className="mt-2 text-sm text-ink-soft">
          Current status:{" "}
          <span className="font-semibold tracking-wide text-ink uppercase">
            {order.status}
          </span>
        </p>
        <form
          action={updateOrderStatusAction}
          className="mt-5 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="id" value={order.id} />
          <label className="block">
            <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
              Change status
            </span>
            <select
              key={order.status}
              name="status"
              defaultValue={order.status}
              className="mt-2 block border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
            >
              <option value="PENDING">Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Preparing</option>
              <option value="SHIPPED">On the way</option>
              <option value="FULFILLED">Delivered</option>
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
      </div>

      <div className="mt-6 rounded-3xl border border-ink/10 bg-foam/80 p-5 md:p-6">
        <h3 className="font-display text-2xl text-ink">Shipping to</h3>
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
  );
}

export default function AdminOrderDetailPage(props: OrderDetailPageProps) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading order...</p>}>
      <OrderDetail {...props} />
    </Suspense>
  );
}
