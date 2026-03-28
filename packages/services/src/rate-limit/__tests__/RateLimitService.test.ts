import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimitService } from '../RateLimitService.js';

// Mock Redis that mirrors the Lua script behavior used by RateLimitService.
// The real service calls redis.eval() with an atomic Lua script, so we simulate
// the same check-and-increment logic here.
function createMockRedis() {
  const store = new Map<string, number>();
  return {
    eval: vi.fn(async (_script: string, _numKeys: number, key: string, limitStr: string, _ttlStr: string) => {
      const limit = parseInt(limitStr, 10);
      const current = store.get(key) ?? 0;
      if (current >= limit) {
        return -1; // Over limit — reject without incrementing
      }
      const newVal = current + 1;
      store.set(key, newVal);
      return newVal;
    }),
    get: vi.fn(async (key: string) => {
      const val = store.get(key);
      return val !== undefined ? String(val) : null;
    }),
    expire: vi.fn(async () => 1),
    // expose store for test assertions
    _store: store,
  };
}

describe('RateLimitService', () => {
  let mockRedis: ReturnType<typeof createMockRedis>;
  let service: RateLimitService;

  beforeEach(() => {
    mockRedis = createMockRedis();
    // Cast to Redis since we only use a subset of methods
    service = new RateLimitService(mockRedis as never, { freeLimit: 3 });
  });

  describe('checkAndIncrement', () => {
    it('should allow requests within the limit', async () => {
      const result = await service.checkAndIncrement('user-1', false);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.resetAt).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/);
    });

    it('should decrement remaining on each call', async () => {
      const r1 = await service.checkAndIncrement('user-1', false);
      const r2 = await service.checkAndIncrement('user-1', false);
      const r3 = await service.checkAndIncrement('user-1', false);
      expect(r1.remaining).toBe(2);
      expect(r2.remaining).toBe(1);
      expect(r3.remaining).toBe(0);
      expect(r3.allowed).toBe(true);
    });

    it('should deny requests exceeding the limit', async () => {
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false);
      const r4 = await service.checkAndIncrement('user-1', false);
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
    });

    it('should not increment counter when request is denied', async () => {
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false); // denied — Lua script rejects without incrementing
      // Counter should still be at 3, not 4 (Lua returns -1 without INCR)
      const remaining = await service.getRemaining('user-1', false);
      expect(remaining).toBe(0);
    });

    it('should always allow subscribed users', async () => {
      const result = await service.checkAndIncrement('user-1', true);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
      expect(mockRedis.eval).not.toHaveBeenCalled();
    });

    it('should call eval with correct key and limit args', async () => {
      await service.checkAndIncrement('user-1', false);
      expect(mockRedis.eval).toHaveBeenCalledTimes(1);
      const [, , key, limitStr, ttlStr] = mockRedis.eval.mock.calls[0]!;
      expect(key).toMatch(/^anplexa:rate:user-1:\d{4}-\d{2}-\d{2}$/);
      expect(limitStr).toBe('3');
      expect(Number(ttlStr)).toBeGreaterThan(0);
      expect(Number(ttlStr)).toBeLessThanOrEqual(86400);
    });

    it('should call eval on each request', async () => {
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false);
      expect(mockRedis.eval).toHaveBeenCalledTimes(2);
    });

    it('should track different users independently', async () => {
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false);
      const r1 = await service.checkAndIncrement('user-2', false);
      expect(r1.remaining).toBe(2); // user-2 is on their first message
    });
  });

  describe('getRemaining', () => {
    it('should return full limit for unused users', async () => {
      const remaining = await service.getRemaining('user-new', false);
      expect(remaining).toBe(3);
    });

    it('should return correct remaining after usage', async () => {
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false);
      const remaining = await service.getRemaining('user-1', false);
      expect(remaining).toBe(1);
    });

    it('should return 0 when limit exhausted', async () => {
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false);
      const remaining = await service.getRemaining('user-1', false);
      expect(remaining).toBe(0);
    });

    it('should return Infinity for subscribed users', async () => {
      const remaining = await service.getRemaining('user-1', true);
      expect(remaining).toBe(Infinity);
      expect(mockRedis.get).not.toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should use default freeLimit of 5', async () => {
      const defaultService = new RateLimitService(mockRedis as never);
      // 5 messages should all be allowed
      for (let i = 0; i < 5; i++) {
        const r = await defaultService.checkAndIncrement(`cfg-user`, false);
        expect(r.allowed).toBe(true);
      }
      const r6 = await defaultService.checkAndIncrement(`cfg-user`, false);
      expect(r6.allowed).toBe(false);
    });

    it('should use custom key prefix', async () => {
      const customService = new RateLimitService(mockRedis as never, {
        keyPrefix: 'custom:rl',
      });
      await customService.checkAndIncrement('user-1', false);
      // The key is the 3rd argument to eval (index 2): eval(script, numKeys, key, ...)
      const key = mockRedis.eval.mock.calls[mockRedis.eval.mock.calls.length - 1]![2] as string;
      expect(key).toMatch(/^custom:rl:user-1:\d{4}-\d{2}-\d{2}$/);
    });
  });
});
