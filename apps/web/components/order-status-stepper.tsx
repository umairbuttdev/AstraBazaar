import {
  ORDER_STEPPER_STEPS,
  stepperIndexForStatus,
  type OrderStatus,
} from "@/lib/order-types";

type OrderStatusStepperProps = {
  status: OrderStatus;
};

export function OrderStatusStepper({ status }: OrderStatusStepperProps) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-2xl border border-ink/10 bg-mist/40 px-4 py-3 text-center text-sm text-ink-soft">
        This order was cancelled.
      </div>
    );
  }

  const activeIndex = stepperIndexForStatus(status);

  return (
    <ol className="grid grid-cols-5 gap-1">
      {ORDER_STEPPER_STEPS.map((step, index) => {
        const complete = index <= activeIndex;
        const current = index === activeIndex;

        return (
          <li key={step.status} className="relative flex flex-col items-center">
            {index < ORDER_STEPPER_STEPS.length - 1 ? (
              <span
                aria-hidden
                className={`absolute top-3 left-[calc(50%+10px)] h-0.5 w-[calc(100%-20px)] ${
                  index < activeIndex ? "bg-copper" : "bg-mist"
                }`}
              />
            ) : null}
            <span
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                complete
                  ? "bg-copper text-foam"
                  : "border border-mist bg-foam text-ink-soft"
              } ${current ? "ring-2 ring-copper/30" : ""}`}
            >
              {complete ? "✓" : index + 1}
            </span>
            <span
              className={`mt-2 text-center text-[10px] leading-tight sm:text-xs ${
                complete ? "text-ink" : "text-ink-soft"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
