"use client";

import {
  removeCartItemAction,
  updateCartItemAction,
} from "@/app/cart/actions";
import { track } from "@/lib/analytics";
import type { CartItem } from "@/lib/cart-types";

export function QuantityControls({ item }: { item: CartItem }) {
  if (item.available <= 0) {
    return null;
  }

  const nextDown =
    item.quantity > item.available ? item.available : item.quantity - 1;
  const canDecrease = item.quantity > 1 || item.quantity > item.available;
  const canIncrease = item.quantity < item.available;

  return (
    <div className="inline-flex items-center rounded-md border border-border">
      <form
        action={updateCartItemAction}
        onSubmit={() =>
          track("cart_quantity_updated", {
            variantId: item.variantId,
            quantity: nextDown,
          })
        }
      >
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="quantity" value={nextDown} />
        <button
          type="submit"
          disabled={!canDecrease}
          aria-label={
            item.quantity > item.available
              ? `Set quantity to ${item.available}`
              : "Decrease quantity"
          }
          className="inline-flex h-11 w-11 items-center justify-center text-lg disabled:opacity-40"
        >
          −
        </button>
      </form>
      <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">
        {item.quantity}
      </span>
      <form
        action={updateCartItemAction}
        onSubmit={() =>
          track("cart_quantity_updated", {
            variantId: item.variantId,
            quantity: item.quantity + 1,
          })
        }
      >
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="quantity" value={item.quantity + 1} />
        <button
          type="submit"
          disabled={!canIncrease}
          aria-label="Increase quantity"
          className="inline-flex h-11 w-11 items-center justify-center text-lg disabled:opacity-40"
        >
          +
        </button>
      </form>
    </div>
  );
}

export function RemoveCartItem({ itemId, variantId }: { itemId: string; variantId: string }) {
  return (
    <form
      action={removeCartItemAction}
      onSubmit={() => track("cart_item_removed", { variantId })}
    >
      <input type="hidden" name="itemId" value={itemId} />
      <button
        type="submit"
        className="text-sm text-foreground-muted underline underline-offset-4 hover:text-foreground"
      >
        Remove
      </button>
    </form>
  );
}
