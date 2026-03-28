import { timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate internal API key for service-to-service calls.
 *
 * Used by the Python LiveKit agent worker to call back into the Anplexa API
 * for memory sync, call summaries, and event logging.
 *
 * Expects `Authorization: Bearer <INTERNAL_API_KEY>` header.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function internalApiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) {
    res.status(503).json({ error: 'Internal API key not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const providedKey = authHeader.slice(7);

  // Use timing-safe comparison to prevent timing attacks
  const expected = Buffer.from(internalKey, 'utf-8');
  const provided = Buffer.from(providedKey, 'utf-8');
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    res.status(403).json({ error: 'Invalid internal API key' });
    return;
  }

  next();
}
