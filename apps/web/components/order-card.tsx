import Link from "next/link";
import { deleteOrderAction as deleteCustomerOrderAction } from "@/app/orders/actions";
import { deleteAdminOrderAction } from "@/app/admin/actions";
import { OrderStatusStepper } from "@/components/order-status-stepper";
import { orderStatusLabel, type Order } from "@/lib/order-types";

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

type OrderCardProps = {
  order: Order;
  mode?: "customer" | "admin";
};

export function OrderCard({ order, mode = "customer" }: OrderCardProps) {
  const shortId = order.id.slice(-8).toUpperCase();
  const isAdmin = mode === "admin";
  const detailsHref = isAdmin
    ? `/admin/orders/${order.id}`
    : `/orders/${order.id}`;
  const deleteAction = isAdmin
    ? deleteAdminOrderAction
    : deleteCustomerOrderAction;
  const statusTone =
    order.status === "FULFILLED"
      ? "bg-emerald-50 text-emerald-800"
      : order.status === "CANCELLED"
        ? "bg-red-50 text-red-800"
        : "bg-copper/15 text-copper-deep";

  return (
    <article className="rounded-3xl border border-ink/10 bg-foam/80 p-5 shadow-[0_10px_30px_rgba(16,24,32,0.04)] md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-sm font-semibold tracking-wide text-foam">
            AB
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-ink">
                {isAdmin ? order.fullName : "AstraBazaar"}
              </p>
              {!isAdmin ? (
                <span
                  aria-label="Verified store"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-copper text-[10px] text-foam"
                >
                  ✓
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              Order #{shortId}
              {isAdmin ? ` · ${order.email}` : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}
          >
            {order.status === "FULFILLED" ? "✓ " : ""}
            {orderStatusLabel(order.status)}
          </span>
          <form action={deleteAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <button
              type="submit"
              aria-label="Delete order"
              title="Delete order"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-700 transition-colors hover:bg-red-100"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 7h16" />
                <path d="M9 7V5h6v2" />
                <path d="M8 7l1 12h6l1-12" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm text-ink-soft">
          {isAdmin ? "Order items" : "Your items"}
        </p>
        <ul className="mt-3 space-y-3">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 text-sm"
            >
              <div>
                <p className="font-medium text-ink">
                  {item.productName}
                  {item.variantName ? ` · ${item.variantName}` : ""} ×{" "}
                  {item.quantity}
                </p>
              </div>
              <p className="shrink-0 font-semibold text-ink">
                {formatPrice(
                  (Number(item.unitPrice) * item.quantity).toFixed(2),
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-ink/8 pt-4">
        <p className="text-sm text-ink-soft">Estimated total</p>
        <p className="text-base font-semibold text-ink">
          {formatPrice(order.total)}
        </p>
      </div>

      <div className="mt-5">
        <OrderStatusStepper status={order.status} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          href={detailsHref}
          className="inline-flex items-center justify-center rounded-full border border-ink/15 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-copper hover:text-copper"
        >
          View details
        </Link>
        {isAdmin ? (
          <a
            href={`mailto:${order.email}?subject=${encodeURIComponent(`Order ${shortId}`)}`}
            className="inline-flex items-center justify-center rounded-full border border-copper/40 px-4 py-3 text-sm font-semibold text-copper-deep transition-colors hover:bg-copper/10"
          >
            Email customer
          </a>
        ) : (
          <a
            href={`mailto:support@astrabazaar.local?subject=${encodeURIComponent(`Order ${shortId}`)}`}
            className="inline-flex items-center justify-center rounded-full border border-copper/40 px-4 py-3 text-sm font-semibold text-copper-deep transition-colors hover:bg-copper/10"
          >
            Support chat
          </a>
        )}
      </div>
    </article>
  );
}
