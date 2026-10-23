"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addWishlistItem, removeWishlistItem } from "@/lib/wishlist-api";
import { commerceError } from "@/lib/commerce-errors";
import { safeNext } from "@/lib/safe-next";

export type WishlistState = {
  saved?: boolean;
  error?: string;
};

export async function toggleWishlistAction(
  _previous: WishlistState,
  formData: FormData,
): Promise<WishlistState> {
  const productId = String(formData.get("productId") ?? "");
  const saved = formData.get("saved") === "1";
  const returnTo = safeNext(formData.get("returnTo") ?? "/");

  if (!productId) {
    return { error: "We couldn't update your wishlist. Please try again." };
  }

  try {
    if (saved) {
      await removeWishlistItem(productId);
    } else {
      await addWishlistItem(productId);
    }
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect(
        `/login?next=${encodeURIComponent(returnTo)}&error=${encodeURIComponent("Please login to save products.")}`,
      );
    }
    return {
      saved,
      error: commerceError(
        error,
        "We couldn't update your wishlist. Please try again.",
      ),
    };
  }

  revalidatePath("/", "layout");
  return { saved: !saved };
}
