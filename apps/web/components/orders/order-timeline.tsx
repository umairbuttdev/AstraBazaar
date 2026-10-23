import {
  ORDER_STEPPER_STEPS,
  formatOrderDate,
  orderStatusLabel,
  stepperIndexForStatus,
  type Order,
  type OrderStatus,
} from "@/lib/order-types";

function marker(state: "completed" | "current" | "upcoming") {
  if (state === "completed") return "✓";
  if (state === "current") return "●";
  return "○";
}

export function OrderTimeline({ order }: { order: Order }) {
  const history = order.statusHistory ?? [];
  const recorded = new Set(history.map((event) => event.status));
  const activeIndex = stepperIndexForStatus(order.status);

  const upcoming =
    order.status === "CANCELLED"
      ? []
      : ORDER_STEPPER_STEPS.filter(
          (step, index) => index > activeIndex && !recorded.has(step.status),
        );

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Order progress</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Current status: {orderStatusLabel(order.status)}
      </p>

      {history.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">
          No status updates have been recorded yet.
        </p>
      ) : (
        <ol className="mt-6 space-y-0">
          {history.map((event, index) => {
            const current = event.status === order.status && index === history.length - 1;
            const state = current ? "current" : "completed";
            return (
              <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                {index < history.length - 1 || upcoming.length > 0 ? (
                  <span
                    aria-hidden
                    className="absolute top-6 left-[11px] h-[calc(100%-12px)] w-px bg-ink/15"
                  />
                ) : null}
                <span
                  aria-hidden
                  className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                    state === "current"
                      ? "bg-ink text-foam"
                      : "bg-copper text-foam"
                  }`}
                >
                  {marker(state)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    <span className="sr-only">
                      {state === "current" ? "Current: " : "Completed: "}
                    </span>
                    {orderStatusLabel(event.status as OrderStatus)}
                  </p>
                  <time
                    dateTime={event.createdAt}
                    className="mt-1 block text-sm text-ink-soft"
                  >
                    {formatOrderDate(event.createdAt, true)}
                  </time>
                </div>
              </li>
            );
          })}
          {upcoming.map((step, index) => (
            <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
              {index < upcoming.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-6 left-[11px] h-[calc(100%-12px)] w-px bg-ink/10"
                />
              ) : null}
              <span
                aria-hidden
                className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink/20 bg-foam text-xs text-ink-soft"
              >
                {marker("upcoming")}
              </span>
              <div>
                <p className="text-sm text-ink-soft">
                  <span className="sr-only">Upcoming: </span>
                  {step.label}
                </p>
                <p className="mt-1 text-xs tracking-wide text-ink-soft uppercase">
                  Upcoming
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
