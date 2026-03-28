import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimitMiddleware } from '../rateLimitMiddleware.js';
import type { IRateLimitService, RateLimitResult } from '@anplexa/core';

function createMockRateLimitService(overrides: Partial<IRateLimitService> = {}): IRateLimitService {
  return {
    checkAndIncrement: vi.fn(async (): Promise<RateLimitResult> => ({
      allowed: true,
      remaining: 4,
      resetAt: '2026-01-02T00:00:00.000Z',
    })),
    getRemaining: vi.fn(async () => 4),
    ...overrides,
  };
}

function createMockReq(user?: { id: string; isSubscribed?: boolean }) {
  return { user } as Record<string, unknown>;
}

function createMockRes() {
  const headers: Record<string, string> = {};
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn((key: string, val: string) => { headers[key] = val; }),
    _headers: headers,
  };
  return res;
}

describe('rateLimitMiddleware', () => {
  let mockService: IRateLimitService;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockService = createMockRateLimitService();
    next = vi.fn();
  });

  it('should return 401 if no user', async () => {
    const middleware = rateLimitMiddleware(mockService);
    const req = createMockReq();
    const res = createMockRes();

    await middleware(req as never, res as never, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when request is allowed', async () => {
    const middleware = rateLimitMiddleware(mockService);
    const req = createMockReq({ id: 'user-1', isSubscribed: false });
    const res = createMockRes();

    await middleware(req as never, res as never, next);

    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', '2026-01-02T00:00:00.000Z');
  });

  it('should return 429 when rate limit exceeded', async () => {
    mockService = createMockRateLimitService({
      checkAndIncrement: vi.fn(async () => ({
        allowed: false,
        remaining: 0,
        resetAt: '2026-01-02T00:00:00.000Z',
      })),
    });
    const middleware = rateLimitMiddleware(mockService);
    const req = createMockReq({ id: 'user-1', isSubscribed: false });
    const res = createMockRes();

    await middleware(req as never, res as never, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      remaining: 0,
      resetAt: '2026-01-02T00:00:00.000Z',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set rate-limit headers even on denial', async () => {
    mockService = createMockRateLimitService({
      checkAndIncrement: vi.fn(async () => ({
        allowed: false,
        remaining: 0,
        resetAt: '2026-01-02T00:00:00.000Z',
      })),
    });
    const middleware = rateLimitMiddleware(mockService);
    const req = createMockReq({ id: 'user-1' });
    const res = createMockRes();

    await middleware(req as never, res as never, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', '2026-01-02T00:00:00.000Z');
  });

  it('should default isSubscribed to false', async () => {
    const middleware = rateLimitMiddleware(mockService);
    const req = createMockReq({ id: 'user-1' }); // no isSubscribed
    const res = createMockRes();

    await middleware(req as never, res as never, next);

    expect(mockService.checkAndIncrement).toHaveBeenCalledWith('user-1', false);
  });

  it('should fail open on Redis errors', async () => {
    mockService = createMockRateLimitService({
      checkAndIncrement: vi.fn(async () => { throw new Error('Redis connection lost'); }),
    });
    const middleware = rateLimitMiddleware(mockService);
    const req = createMockReq({ id: 'user-1', isSubscribed: false });
    const res = createMockRes();

    // Suppress console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await middleware(req as never, res as never, next);

    expect(next).toHaveBeenCalled(); // fail open
    consoleSpy.mockRestore();
  });
});
