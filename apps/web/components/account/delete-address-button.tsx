"use client";

import { useRef } from "react";
import { deleteAddressAction } from "@/app/account/actions";

export function DeleteAddressButton({ addressId }: { addressId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="text-sm font-semibold text-red-800 underline-offset-4 hover:underline"
        onClick={() => dialogRef.current?.showModal()}
      >
        Delete
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-address-${addressId}`}
        className="w-[min(100%,24rem)] rounded-2xl border border-ink/10 bg-foam p-6 text-ink backdrop:bg-ink/40"
      >
        <h2 id={`delete-address-${addressId}`} className="font-display text-2xl">
          Delete this address?
        </h2>
        <p className="mt-3 text-sm text-ink-soft">
          Orders already placed keep the address that was used at checkout.
        </p>
        <form action={deleteAddressAction} className="mt-6 flex flex-wrap gap-3">
          <input type="hidden" name="addressId" value={addressId} />
          <button
            type="submit"
            className="inline-flex bg-red-800 px-4 py-2.5 text-sm font-semibold text-foam"
          >
            Delete address
          </button>
          <button
            type="button"
            className="inline-flex border border-ink/15 px-4 py-2.5 text-sm font-semibold"
            onClick={() => dialogRef.current?.close()}
          >
            Keep address
          </button>
        </form>
      </dialog>
    </>
  );
}
