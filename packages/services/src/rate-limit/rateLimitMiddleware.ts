import type { Request, Response, NextFunction } from 'express';
import type { IRateLimitService } from '@anplexa/core';

/**
 * Express middleware that enforces rate limiting on chat message endpoints.
 *
 * Expects `req.user` to contain `{ id: string; isSubscribed: boolean }`.
 * Returns 429 with a JSON body matching `RateLimitErrorResponse` when the limit is exceeded.
 */
export function rateLimitMiddleware(rateLimitService: IRateLimitService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as unknown as Record<string, unknown>).user as
      | { id?: string; sub?: string; isSubscribed?: boolean }
      | undefined;

    const userId = user?.id || user?.sub;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const result = await rateLimitService.checkAndIncrement(
        userId,
        user?.isSubscribed ?? false,
      );

      // Always set rate-limit headers
      res.setHeader('X-RateLimit-Remaining', String(result.remaining));
      res.setHeader('X-RateLimit-Reset', result.resetAt);

      if (!result.allowed) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          remaining: result.remaining,
          resetAt: result.resetAt,
        });
        return;
      }

      next();
    } catch (err) {
      // If Redis is down, fail open — allow the request through
      console.error('[RateLimitMiddleware] Redis error, failing open:', err);
      next();
    }
  };
}
