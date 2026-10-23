"use server";

import { redirect } from "next/navigation";
import {
  addCartItem,
  moveCartItemToWishlist,
  removeCartItem,
  updateCartItem,
} from "@/lib/cart-api";
import { commerceError } from "@/lib/commerce-errors";
import { safeNext } from "@/lib/safe-next";

function loginRedirect(returnTo: string, message: string): never {
  redirect(
    `/login?next=${encodeURIComponent(safeNext(returnTo))}&error=${encodeURIComponent(message)}`,
  );
}

export async function addToCartAction(formData: FormData) {
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const returnTo = safeNext(formData.get("returnTo") ?? "/cart");

  try {
    await addCartItem(variantId, quantity);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      loginRedirect(returnTo, "Please login to add items to your cart.");
    }
    redirect(
      `${returnTo}?error=${encodeURIComponent(commerceError(error, "We couldn't update your cart. Please try again."))}`,
    );
  }

  redirect("/cart");
}

export async function updateCartItemAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);

  try {
    await updateCartItem(itemId, quantity);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      loginRedirect("/cart", "Please login to update your cart.");
    }
    redirect(
      `/cart?error=${encodeURIComponent(commerceError(error, "We couldn't update your cart. Please try again."))}`,
    );
  }

  redirect("/cart");
}

export async function removeCartItemAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");

  try {
    await removeCartItem(itemId);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      loginRedirect("/cart", "Please login to update your cart.");
    }
    redirect(
      `/cart?error=${encodeURIComponent(commerceError(error, "We couldn't update your cart. Please try again."))}`,
    );
  }

  redirect("/cart?message=Item%20removed");
}

export async function moveCartItemToWishlistAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");

  try {
    await moveCartItemToWishlist(itemId);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      loginRedirect("/cart", "Please login to update your cart.");
    }
    redirect(
      `/cart?error=${encodeURIComponent(commerceError(error, "We couldn't move this item to your wishlist."))}`,
    );
  }

  redirect("/cart?message=Moved%20to%20wishlist");
}
