import { describe, expect, it, vi } from 'vitest';
import { applyRateLimit } from '@/app/lib/rate-limit';

describe('applyRateLimit (in-memory fallback)', () => {
  it('allows requests under the configured limit', async () => {
    const key = `test-${Math.random()}`;
    const first = await applyRateLimit(key, 2, 60_000);
    const second = await applyRateLimit(key, 2, 60_000);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
  });

  it('blocks requests once the limit is exceeded', async () => {
    const key = `test-${Math.random()}`;
    await applyRateLimit(key, 1, 60_000);
    const result = await applyRateLimit(key, 1, 60_000);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('resets the window after it expires', async () => {
    const key = `test-${Math.random()}`;
    vi.useFakeTimers();

    await applyRateLimit(key, 1, 1000);
    vi.advanceTimersByTime(1100);
    const result = await applyRateLimit(key, 1, 1000);

    expect(result.allowed).toBe(true);
    vi.useRealTimers();
  });
});
