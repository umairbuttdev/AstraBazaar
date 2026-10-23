"use client";

import { useRef, useState } from "react";
import { cancelOrderAction } from "@/app/orders/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { track } from "@/lib/analytics";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-red-800 underline underline-offset-4"
      >
        Cancel order
      </button>
      <form
        ref={formRef}
        action={cancelOrderAction}
        className="hidden"
        aria-hidden
      >
        <input type="hidden" name="orderId" value={orderId} />
      </form>
      <ConfirmDialog
        open={open}
        title="Cancel order?"
        description="Cancel this order? If it is still cancellable, reserved stock will be returned to inventory."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          track("order_cancelled", { orderId });
          formRef.current?.requestSubmit();
        }}
      />
    </div>
  );
}
