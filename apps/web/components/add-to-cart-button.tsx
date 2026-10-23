"use client";

import { useActionState, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import {
  addProductToCartAction,
  type ProductCartState,
} from "@/app/products/actions";
import { CartAddedDialog } from "@/components/cart-added-dialog";
import { formatMoney } from "@/lib/product-pricing";

type AddToCartButtonProps = {
  variantId: string;
  returnTo: string;
  productName: string;
  price: string;
};

const initialState: ProductCartState = { status: "idle" };

export function AddToCartButton({
  variantId,
  returnTo,
  productName,
  price,
}: AddToCartButtonProps) {
  const [state, action, pending] = useActionState(
    addProductToCartAction,
    initialState,
  );
  const [dismissed, setDismissed] = useState(false);
  const open = state.status === "added" && !dismissed;

  useEffect(() => {
    if (state.status !== "added") return;
    track("cart_item_added", { variantId, quantity: 1 });
  }, [state, variantId]);

  return (
    <>
      <form
        action={(formData) => {
          setDismissed(false);
          return action(formData);
        }}
      >
        <input type="hidden" name="variantId" value={variantId} />
        <input type="hidden" name="quantity" value="1" />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add to cart"}
        </button>
        {state.status === "error" && state.message ? (
          <p className="text-body-sm mt-2 text-red-700" role="alert">
            {state.message}
          </p>
        ) : null}
      </form>
      <CartAddedDialog
        open={open}
        productName={productName}
        quantity={1}
        price={formatMoney(price)}
        onClose={() => setDismissed(true)}
      />
    </>
  );
}
