import type { Request, Response, NextFunction } from 'express';
import type { IRateLimitService } from '@anplexa/core';

/**
 * Lookup function to resolve subscription status from the user ID.
 * The middleware calls this to determine if the user is subscribed,
 * since the JWT payload does not include subscription status.
 */
export type SubscriptionLookup = (userId: string) => Promise<boolean>;

/**
 * Express middleware that enforces rate limiting on chat message endpoints.
 *
 * Expects `req.user` to contain `{ sub: string }` (set by authMiddleware).
 * Uses `subscriptionLookup` to resolve subscription status from the DB.
 * Returns 429 with a JSON body matching `RateLimitErrorResponse` when the limit is exceeded.
 */
export function rateLimitMiddleware(
  rateLimitService: IRateLimitService,
  subscriptionLookup?: SubscriptionLookup,
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as unknown as Record<string, unknown>).user as
      | { id?: string; sub?: string }
      | undefined;

    const userId = user?.id || user?.sub;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      // Resolve subscription status from the DB (not from JWT, which doesn't carry it)
      const isSubscribed = subscriptionLookup
        ? await subscriptionLookup(userId)
        : false;

      const result = await rateLimitService.checkAndIncrement(
        userId,
        isSubscribed,
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
