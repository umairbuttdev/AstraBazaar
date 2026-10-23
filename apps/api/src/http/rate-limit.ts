export type RateLimitResult = {
  ok: boolean;
  remaining: number;
};

export function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return function allow(key: string, now = Date.now()): RateLimitResult {
    if (buckets.size > 5000) {
      for (const [id, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(id);
      }
    }

    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, remaining: limit - 1 };
    }

    if (current.count >= limit) {
      return { ok: false, remaining: 0 };
    }

    current.count += 1;
    return { ok: true, remaining: limit - current.count };
  };
}
