import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimitService } from '../RateLimitService.js';

// Minimal mock Redis interface matching what we actually call
function createMockRedis() {
  const store = new Map<string, number>();
  return {
    incr: vi.fn(async (key: string) => {
      const val = (store.get(key) ?? 0) + 1;
      store.set(key, val);
      return val;
    }),
    decr: vi.fn(async (key: string) => {
      const val = (store.get(key) ?? 0) - 1;
      store.set(key, val);
      return val;
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

    it('should roll back counter when request is denied', async () => {
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false); // denied, rolled back
      expect(mockRedis.decr).toHaveBeenCalled();
      // Counter should still be at 3, not 4
      const remaining = await service.getRemaining('user-1', false);
      expect(remaining).toBe(0);
    });

    it('should always allow subscribed users', async () => {
      const result = await service.checkAndIncrement('user-1', true);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
      expect(mockRedis.incr).not.toHaveBeenCalled();
    });

    it('should set expiry on first increment', async () => {
      await service.checkAndIncrement('user-1', false);
      expect(mockRedis.expire).toHaveBeenCalledTimes(1);
      // TTL should be a positive number of seconds
      const ttlArg = mockRedis.expire.mock.calls[0]![1] as number;
      expect(ttlArg).toBeGreaterThan(0);
      expect(ttlArg).toBeLessThanOrEqual(86400);
    });

    it('should not set expiry on subsequent increments', async () => {
      await service.checkAndIncrement('user-1', false);
      await service.checkAndIncrement('user-1', false);
      expect(mockRedis.expire).toHaveBeenCalledTimes(1);
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
      const key = mockRedis.incr.mock.calls[mockRedis.incr.mock.calls.length - 1]![0] as string;
      expect(key).toMatch(/^custom:rl:user-1:\d{4}-\d{2}-\d{2}$/);
    });
  });
});
