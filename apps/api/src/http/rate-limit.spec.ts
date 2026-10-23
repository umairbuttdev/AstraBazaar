import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rate-limit.js';

describe('createRateLimiter', () => {
  it('allows requests inside the window and blocks the next one', () => {
    const allow = createRateLimiter(2, 1_000);
    expect(allow('a', 0).ok).toBe(true);
    expect(allow('a', 10).ok).toBe(true);
    expect(allow('a', 20).ok).toBe(false);
  });

  it('resets after the window and keeps keys separate', () => {
    const allow = createRateLimiter(1, 1_000);
    expect(allow('a', 0).ok).toBe(true);
    expect(allow('b', 0).ok).toBe(true);
    expect(allow('a', 1_001).ok).toBe(true);
  });
});
