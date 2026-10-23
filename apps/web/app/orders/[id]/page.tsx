import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { TrackView } from "@/components/analytics/track-view";
import { CancelOrderButton } from "@/components/orders/cancel-order-button";
import { CopyText } from "@/components/orders/copy-text";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { getOrder } from "@/lib/checkout-api";
import {
  formatOrderDate,
  formatOrderMoney,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  shippingMethodLabel,
  type Order,
  type OrderItem,
} from "@/lib/order-types";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

type OrderPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
};

function lineTotal(item: OrderItem) {
  const amount = Number(item.unitPrice) * item.quantity;
  if (Number.isNaN(amount)) return item.unitPrice;
  return amount.toFixed(2);
}

function confirmationMessage(order: Order) {
  const due = formatOrderMoney(order.total, order.currency);
  if (order.paymentStatus === "PAID") {
    return `Payment received. Order total ${due}.`;
  }
  if (order.paymentStatus === "FAILED") {
    return "Payment was not completed. This order is not marked as paid.";
  }
  if (order.paymentStatus === "PENDING") {
    return "Payment is still pending. This order is not marked as paid.";
  }
  if (order.paymentMethod === "COD") {
    return `Cash on delivery. ${due} is due when the order arrives.`;
  }
  return `Order total ${due}. Payment status: ${paymentStatusLabel(order) ?? "recorded on the order"}.`;
}

async function OrderContent({ params, searchParams }: OrderPageProps) {
  await connection();
  const { id } = await params;
  const query = await searchParams;
  const placed = query.placed === "1";
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <h1 className="font-display text-4xl text-ink">Order details</h1>
        <p className="mt-4 text-ink-soft">Login to view this order.</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/orders/${id}`)}`}
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
      <div className="mx-auto w-full max-w-xl">
        <h1 className="font-display text-4xl text-ink">Order details</h1>
        <p className="mt-4 text-ink-soft">Unable to load your order right now.</p>
        <Link
          href={`/orders/${id}`}
          className="mt-8 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Try again
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto w-full max-w-xl">
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

  const method = paymentMethodLabel(order.paymentMethod);
  const payment = paymentStatusLabel(order);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/orders"
        className="text-sm text-ink-soft underline underline-offset-4"
      >
        Back to orders
      </Link>

      <div className="mt-6">
        <p className="text-sm tracking-[0.2em] text-copper uppercase">
          {placed ? "Order placed" : "Order"}
        </p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          {placed ? "Order placed successfully" : "Order details"}
        </h1>
        {placed ? (
          <>
            <TrackView
              name={order.paymentStatus === "FAILED" ? "payment_failed" : "purchase_completed"}
              onceKey={`purchase:${order.id}`}
              persist
              properties={{
                orderId: order.id,
                total: order.total,
                currency: order.currency,
                itemCount: order.itemCount ?? order.items.length,
                paymentMethod: order.paymentMethod ?? "",
                paymentStatus: order.paymentStatus ?? "",
              }}
            />
            <p className="mt-4 text-ink-soft">
              Your order has been received. {confirmationMessage(order)}
            </p>
          </>
        ) : (
          <p className="mt-4 text-ink-soft">{confirmationMessage(order)}</p>
        )}
      </div>

      <section className="mt-8 rounded-3xl border border-ink/10 bg-foam p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-ink-soft">Order number</p>
            <p className="mt-1 font-semibold break-all text-ink">{order.id}</p>
            <div className="mt-2">
              <CopyText value={order.id} label="Copy order number" />
            </div>
          </div>
          <p className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-foam">
            {orderStatusLabel(order.status)}
          </p>
        </div>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-soft">Order date</dt>
            <dd className="mt-1 text-ink">{formatOrderDate(order.createdAt, true)}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Payment method</dt>
            <dd className="mt-1 text-ink">{method ?? "Recorded on the order"}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Payment status</dt>
            <dd className="mt-1 text-ink">{payment ?? "Unavailable"}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Shipping method</dt>
            <dd className="mt-1 text-ink">
              {shippingMethodLabel(order.shippingMethod)}
            </dd>
          </div>
          <div>
            <dt className="text-ink-soft">Order total</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatOrderMoney(order.total, order.currency)}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/orders/${order.id}/tracking`}
            className="inline-flex bg-ink px-4 py-2.5 text-sm font-semibold text-foam hover:bg-copper"
          >
            Track order
          </Link>
          <Link
            href="/orders"
            className="inline-flex border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink hover:border-copper"
          >
            View all orders
          </Link>
          <Link
            href="/products"
            className="inline-flex border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink hover:border-copper"
          >
            Continue shopping
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-ink/10 bg-foam p-5 md:p-6">
        <h2 className="font-display text-2xl text-ink">Items</h2>
        <ul className="mt-4 divide-y divide-ink/10">
          {order.items.map((item) => {
            const content = (
              <>
                <p className="font-medium text-ink">{item.productName}</p>
                <p className="text-sm text-ink-soft">
                  {item.variantName ? `${item.variantName} · ` : ""}
                  Qty {item.quantity} · {item.sku}
                </p>
              </>
            );
            return (
              <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  {item.productSlug ? (
                    <Link
                      href={`/products/${encodeURIComponent(item.productSlug)}`}
                      className="hover:text-copper"
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </div>
                <div className="text-right text-sm">
                  <p className="text-ink-soft">
                    {formatOrderMoney(item.unitPrice, order.currency)} each
                  </p>
                  <p className="font-semibold text-ink">
                    {formatOrderMoney(lineTotal(item), order.currency)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 rounded-3xl border border-ink/10 bg-foam p-5 md:p-6">
        <h2 className="font-display text-2xl text-ink">Delivery</h2>
        <div className="mt-4 space-y-1 text-sm text-ink-soft">
          <p className="text-ink">{order.fullName}</p>
          {order.phone ? <p>{order.phone}</p> : null}
          <p>{order.line1}</p>
          {order.line2 ? <p>{order.line2}</p> : null}
          <p>
            {order.city}
            {order.state ? `, ${order.state}` : ""} {order.postalCode}
          </p>
          <p>{order.country}</p>
          <p className="pt-2">{order.email}</p>
          <p className="pt-2 text-ink">
            {shippingMethodLabel(order.shippingMethod)}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-ink/10 bg-foam p-5 md:p-6">
        <h2 className="font-display text-2xl text-ink">Payment</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Method</dt>
            <dd className="text-ink">{method ?? "Recorded on the order"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Status</dt>
            <dd className="text-ink">{payment ?? "Unavailable"}</dd>
          </div>
        </dl>
        {order.paymentStatus === "FAILED" || order.paymentStatus === "PENDING" ? (
          <p className="mt-4 text-sm text-ink-soft">
            Retry payment is not available. Online payment is not set up for this store.
          </p>
        ) : null}
      </section>

      <section className="mt-6 rounded-3xl border border-ink/10 bg-foam p-5 md:p-6">
        <h2 className="font-display text-2xl text-ink">Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd>{formatOrderMoney(order.subtotal, order.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Shipping</dt>
            <dd>{formatOrderMoney(order.shippingAmount ?? "0.00", order.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-ink/10 pt-3 font-semibold text-ink">
            <dt>Total</dt>
            <dd>{formatOrderMoney(order.total, order.currency)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-3xl border border-ink/10 bg-foam p-5 md:p-6">
        <OrderTimeline order={order} />
        <div className="mt-6 border-t border-ink/10 pt-6">
          <h2 className="font-display text-2xl text-ink">Shipment</h2>
          <p className="mt-3 text-sm text-ink-soft">
            Your order is {orderStatusLabel(order.status).toLowerCase()}. Tracking
            information will appear once a shipment is created. No courier or
            delivery estimate is available yet.
          </p>
          <Link
            href={`/orders/${order.id}/tracking`}
            className="mt-4 inline-flex text-sm font-semibold text-ink underline underline-offset-4"
          >
            Open tracking
          </Link>
        </div>
      </section>

      {order.canCancel ? <CancelOrderButton orderId={order.id} /> : null}
    </div>
  );
}

export default function OrderPage(props: OrderPageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 md:px-10 md:py-16">
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-3xl animate-pulse">
            <div className="h-4 w-24 rounded bg-mist" />
            <div className="mt-4 h-10 w-64 rounded bg-mist" />
            <div className="mt-8 h-48 rounded-3xl bg-mist" />
            <p className="mt-4 text-sm text-ink-soft">Loading order details...</p>
          </div>
        }
      >
        <OrderContent {...props} />
      </Suspense>
    </main>
  );
}
