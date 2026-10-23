"use client";

import { useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { orderStatusLabel, type OrderStatus } from "@/lib/order-types";

const statuses: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "FULFILLED",
  "CANCELLED",
];

export function OrderStatusForm({
  orderId,
  status,
  action,
}: {
  orderId: string;
  status: OrderStatus;
  action: (formData: FormData) => void;
}) {
  const [next, setNext] = useState(status);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const allowSubmitRef = useRef(false);

  const needsConfirm = next === "CANCELLED" || next === "FULFILLED";
  const confirmLabel = orderStatusLabel(next);

  return (
    <>
      <form
        ref={formRef}
        action={action}
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          if (next === status) {
            event.preventDefault();
            return;
          }
          if (needsConfirm && !allowSubmitRef.current) {
            event.preventDefault();
            setConfirmOpen(true);
            return;
          }
          allowSubmitRef.current = false;
        }}
      >
        <input type="hidden" name="id" value={orderId} />
        <label className="text-sm">
          <span className="text-ink-soft">New status</span>
          <select
            name="status"
            value={next}
            onChange={(event) => setNext(event.target.value as OrderStatus)}
            className="mt-1 block border border-ink/15 bg-foam px-3 py-2"
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {orderStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="bg-ink px-4 py-2 text-sm font-semibold text-foam hover:bg-copper"
        >
          Update status
        </button>
      </form>
      <ConfirmDialog
        open={confirmOpen}
        title={`Mark as ${confirmLabel}?`}
        description={`Update this order status to ${confirmLabel}? This change is saved immediately.`}
        confirmLabel={`Mark as ${confirmLabel}`}
        cancelLabel="Go back"
        tone={next === "CANCELLED" ? "danger" : "default"}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          allowSubmitRef.current = true;
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
