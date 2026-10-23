import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { CopyText } from "@/components/orders/copy-text";
import { getOrder } from "@/lib/checkout-api";
import {
  formatOrderDate,
  orderStatusLabel,
  shippingMethodLabel,
  type Order,
} from "@/lib/order-types";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Track order",
  robots: { index: false, follow: false },
};

type TrackingPageProps = {
  params: Promise<{ id: string }>;
};

async function TrackingContent({ params }: TrackingPageProps) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-4xl text-ink">Track order</h1>
        <p className="mt-4 text-ink-soft">Login to view tracking for this order.</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/orders/${id}/tracking`)}`}
          className="mt-8 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Login
        </Link>
      </div>
    );
  }

  let order: Order | null = null;
  try {
    order = await getOrder(id);
  } catch {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-4xl text-ink">Track order</h1>
        <p className="mt-4 text-ink-soft">Unable to load your order right now.</p>
        <Link
          href={`/orders/${id}/tracking`}
          className="mt-8 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Try again
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-4xl text-ink">Order not found</h1>
        <p className="mt-4 text-ink-soft">This order could not be found.</p>
        <Link
          href="/orders"
          className="mt-8 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const latest = order.statusHistory?.at(-1);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href={`/orders/${order.id}`}
        className="text-sm text-ink-soft underline underline-offset-4"
      >
        Back to order
      </Link>
      <p className="mt-6 text-sm tracking-[0.2em] text-copper uppercase">
        Tracking
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
        Where is this order?
      </h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        Current status: {orderStatusLabel(order.status)}.
        {latest
          ? ` Latest update ${formatOrderDate(latest.createdAt, true)}.`
          : " No status updates have been recorded yet."}
      </p>

      <section className="mt-8 rounded-3xl border border-ink/10 bg-foam p-5 md:p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-ink-soft">Order number</dt>
            <dd className="mt-1 font-semibold break-all text-ink">{order.id}</dd>
            <div className="mt-2">
              <CopyText value={order.id} label="Copy order number" />
            </div>
          </div>
          <div>
            <dt className="text-ink-soft">Shipping method</dt>
            <dd className="mt-1 text-ink">{shippingMethodLabel(order.shippingMethod)}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Delivering to</dt>
            <dd className="mt-1 text-ink">
              {order.city}
              {order.state ? `, ${order.state}` : ""} {order.postalCode}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-3xl border border-ink/10 bg-foam p-5 md:p-6">
        <h2 className="font-display text-2xl text-ink">Shipment</h2>
        <p className="mt-3 text-sm text-ink-soft">
          Tracking information is not available yet. This store does not have a
          courier shipment for the order. A tracking number will appear here if
          one is created.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-ink/10 bg-foam p-5 md:p-6">
        <OrderTimeline order={order} />
      </section>
    </div>
  );
}

export default function TrackingPage(props: TrackingPageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 md:px-10 md:py-16">
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl animate-pulse">
            <div className="h-4 w-24 rounded bg-mist" />
            <div className="mt-4 h-10 w-72 rounded bg-mist" />
            <div className="mt-8 h-56 rounded-3xl bg-mist" />
            <p className="mt-4 text-sm text-ink-soft">Loading tracking...</p>
          </div>
        }
      >
        <TrackingContent {...props} />
      </Suspense>
    </main>
  );
}
