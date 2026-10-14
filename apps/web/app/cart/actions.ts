"use server";

import { redirect } from "next/navigation";
import {
  addCartItem,
  removeCartItem,
  updateCartItem,
} from "@/lib/cart-api";

export async function addToCartAction(formData: FormData) {
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const returnTo = String(formData.get("returnTo") ?? "/cart");

  try {
    await addCartItem(variantId, quantity);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect(`/login?error=${encodeURIComponent("Please login to add items to your cart.")}`);
    }
    const message =
      error instanceof Error ? error.message : "Could not add item to cart";
    redirect(`${returnTo}?error=${encodeURIComponent(message)}`);
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
      redirect("/login");
    }
    const message =
      error instanceof Error ? error.message : "Could not update cart item";
    redirect(`/cart?error=${encodeURIComponent(message)}`);
  }

  redirect("/cart");
}

export async function removeCartItemAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");

  try {
    await removeCartItem(itemId);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    const message =
      error instanceof Error ? error.message : "Could not remove cart item";
    redirect(`/cart?error=${encodeURIComponent(message)}`);
  }

  redirect("/cart");
}
