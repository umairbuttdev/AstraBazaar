"use client";

import { DeleteConfirmButton } from "@/components/ui/confirm-dialog";

type DeleteAction = (formData: FormData) => void | Promise<void>;

export function DeleteOrderButton({
  orderId,
  label,
  action,
}: {
  orderId: string;
  label?: string;
  action: DeleteAction;
}) {
  return (
    <DeleteConfirmButton
      action={action}
      fields={{ orderId }}
      title="Delete order?"
      description="Permanently delete this order from the database? This cannot be undone. Stock is restored only when the order was still cancellable."
      confirmLabel="Delete order"
      cancelLabel="Keep order"
      trigger={label ?? "Delete"}
      triggerClassName="text-sm font-semibold text-red-800 underline underline-offset-4"
    />
  );
}
