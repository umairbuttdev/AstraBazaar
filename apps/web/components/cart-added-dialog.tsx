"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type CartAddedDialogProps = {
  open: boolean;
  productName: string;
  detail?: string | null;
  quantity: number;
  price: string;
  onClose: () => void;
};

export function CartAddedDialog({
  open,
  productName,
  detail,
  quantity,
  price,
  onClose,
}: CartAddedDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cart-added-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
      className="w-[min(100%-2rem,28rem)] rounded-lg border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-ink/40"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 id="cart-added-title" className="text-h3">
            Added to your cart
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground-muted hover:bg-surface-secondary hover:text-foreground"
          >
            ×
          </button>
        </div>
        <p className="mt-4 font-medium">{productName}</p>
        {detail ? (
          <p className="text-body-sm mt-1 text-foreground-muted">{detail}</p>
        ) : null}
        <p className="text-body-sm mt-2 text-foreground-muted">Qty {quantity}</p>
        <p className="text-price mt-2">{price}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/cart"
            className="inline-flex flex-1 items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
          >
            View cart
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-md border border-border bg-surface px-5 py-3 text-sm font-semibold hover:border-primary hover:text-primary"
          >
            Continue shopping
          </button>
        </div>
      </div>
    </dialog>
  );
}
