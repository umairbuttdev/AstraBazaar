import Link from "next/link";
import {
  formatOrderDate,
  formatOrderMoney,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  type Order,
} from "@/lib/order-types";

function statusTone(status: Order["status"]) {
  if (status === "FULFILLED") return "bg-emerald-50 text-emerald-900";
  if (status === "CANCELLED") return "bg-red-50 text-red-900";
  if (status === "SHIPPED") return "bg-ink text-foam";
  return "bg-copper/15 text-ink";
}

export function OrderSummaryCard({ order }: { order: Order }) {
  const preview = order.items;
  const extra = Math.max(0, (order.lineCount ?? preview.length) - preview.length);
  const payment = paymentStatusLabel(order);
  const method = paymentMethodLabel(order.paymentMethod);

  return (
    <article className="rounded-3xl border border-ink/10 bg-foam p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold break-all text-ink">Order {order.id}</p>
          <p className="mt-1 text-sm text-ink-soft">
            Placed {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}
        >
          {orderStatusLabel(order.status)}
        </span>
      </div>

      <ul className="mt-5 space-y-3 border-t border-ink/10 pt-5">
        {preview.map((item) => (
          <li key={item.id} className="flex gap-3">
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-mist text-sm font-semibold text-ink"
            >
              {item.productName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{item.productName}</p>
              <p className="text-sm text-ink-soft">
                {item.variantName ? `${item.variantName} · ` : ""}
                Qty {item.quantity}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {extra > 0 ? (
        <p className="mt-3 text-sm text-ink-soft">
          + {extra} more {extra === 1 ? "item" : "items"}
        </p>
      ) : null}

      <dl className="mt-5 grid gap-2 border-t border-ink/10 pt-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink-soft">Total</dt>
          <dd className="font-semibold text-ink">
            {formatOrderMoney(order.total, order.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-soft">Payment</dt>
          <dd className="text-ink">
            {method ?? "Payment"}
            {payment ? ` · ${payment}` : ""}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/orders/${order.id}`}
          className="inline-flex bg-ink px-4 py-2.5 text-sm font-semibold text-foam hover:bg-copper"
        >
          View order
        </Link>
        <Link
          href={`/orders/${order.id}/tracking`}
          className="inline-flex border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink hover:border-copper"
        >
          Track order
        </Link>
      </div>
    </article>
  );
}
