export function safeNext(value: unknown) {
  const next = typeof value === "string" ? value : "";
  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\") ||
    next.includes("://")
  ) {
    return "/";
  }
  return next;
}
