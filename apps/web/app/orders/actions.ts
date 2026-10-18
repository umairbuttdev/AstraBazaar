"use server";

import { redirect } from "next/navigation";
import { cancelOrder, deleteOrder } from "@/lib/checkout-api";

export async function cancelOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");

  try {
    await cancelOrder(orderId);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect(
        `/login?error=${encodeURIComponent("Please login to manage orders.")}`,
      );
    }
    const message =
      error instanceof Error ? error.message : "Could not cancel order";
    redirect(`/orders?error=${encodeURIComponent(message)}`);
  }

  redirect(
    `/orders?message=${encodeURIComponent("Order cancelled.")}&filter=cancelled`,
  );
}

export async function deleteOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");

  try {
    await deleteOrder(orderId);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect(
        `/login?error=${encodeURIComponent("Please login to manage orders.")}`,
      );
    }
    const message =
      error instanceof Error ? error.message : "Could not delete order";
    redirect(`/orders?error=${encodeURIComponent(message)}`);
  }

redirect(`/orders?message=${encodeURIComponent("Order deleted.")}`);
}
