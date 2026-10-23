export function commerceError(error: unknown, fallback: string) {
  if (!(error instanceof Error) || error.message === "UNAUTHORIZED") {
    return fallback;
  }

  const message = error.message;
  if (/prisma|invocation|ECONNREFUSED|database/i.test(message)) {
    return fallback;
  }
  if (message === "Not enough stock for this variant") {
    return "There isn't enough stock for that quantity.";
  }
  if (/not found/i.test(message)) {
    return "This product is no longer available.";
  }
  if (
    message.startsWith("Cart API failed") ||
    message.startsWith("Wishlist API failed") ||
    message.startsWith("Checkout API failed")
  ) {
    return fallback;
  }
  return message;
}
