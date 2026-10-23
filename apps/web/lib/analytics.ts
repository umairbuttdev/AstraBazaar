const ALLOWED_PROPERTIES = new Set([
  "productId",
  "slug",
  "sku",
  "variantId",
  "category",
  "query",
  "itemCount",
  "quantity",
  "currency",
  "total",
  "orderId",
  "paymentMethod",
  "paymentStatus",
  "method",
  "saved",
  "page",
]);

export type AnalyticsValue = string | number | boolean;

const recent = new Map<string, number>();

export function sanitizeProperties(properties: Record<string, unknown> = {}) {
  const safe: Record<string, AnalyticsValue> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!ALLOWED_PROPERTIES.has(key)) continue;
    if (typeof value === "number" && Number.isFinite(value)) {
      safe[key] = value;
    } else if (typeof value === "boolean") {
      safe[key] = value;
    } else if (typeof value === "string") {
      safe[key] = key === "query" ? value.slice(0, 80) : value.slice(0, 120);
    }
  }
  return safe;
}

export function track(
  name: string,
  properties: Record<string, unknown> = {},
  options?: { onceKey?: string; persist?: boolean },
) {
  if (typeof window === "undefined") return;

  const onceKey = options?.onceKey;
  if (onceKey && options?.persist) {
    const stored = window.sessionStorage.getItem("astra-analytics-once") ?? "";
    const seen = stored.split(",").filter(Boolean);
    if (seen.includes(onceKey)) return;
    window.sessionStorage.setItem(
      "astra-analytics-once",
      [...seen, onceKey].slice(-40).join(","),
    );
  }

  const dedupeKey = `${name}:${onceKey ?? JSON.stringify(sanitizeProperties(properties))}`;
  const now = Date.now();
  const last = recent.get(dedupeKey);
  if (last && now - last < 1500) return;
  recent.set(dedupeKey, now);

  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  if (!endpoint) return;

  const body = JSON.stringify({
    name,
    properties: sanitizeProperties(properties),
    sentAt: new Date().toISOString(),
  });

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  void fetch(endpoint, {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
    keepalive: true,
  }).catch(() => undefined);
}
