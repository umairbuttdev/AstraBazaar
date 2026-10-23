"use client";

import { useActionState, useEffect } from "react";
import { track } from "@/lib/analytics";
import {
  toggleWishlistAction,
  type WishlistState,
} from "@/app/wishlist/actions";

type WishlistButtonProps = {
  productId: string;
  saved: boolean;
  returnTo: string;
  className?: string;
};

const initialState: WishlistState = {};

export function WishlistButton({
  productId,
  saved,
  returnTo,
  className = "",
}: WishlistButtonProps) {
  const [state, action, pending] = useActionState(
    toggleWishlistAction,
    initialState,
  );
  const confirmed = state.saved ?? saved;
  const active = pending ? !confirmed : confirmed;

  useEffect(() => {
    if (state.saved === undefined) return;
    track(state.saved ? "wishlist_added" : "wishlist_removed", { productId });
  }, [productId, state.saved]);

  return (
    <form action={action} className={className}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="saved" value={confirmed ? "1" : "0"} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        aria-pressed={active}
        aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
        disabled={pending}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-lg leading-none shadow-sm transition-colors hover:border-primary hover:text-primary disabled:opacity-60 ${
          active ? "text-primary" : "text-foreground"
        }`}
      >
        <span aria-hidden="true">{active ? "♥" : "♡"}</span>
      </button>
      {state.error ? (
        <p className="text-body-sm mt-2 max-w-44 text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
