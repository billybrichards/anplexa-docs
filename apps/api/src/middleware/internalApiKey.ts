import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate internal API key for service-to-service calls.
 *
 * Used by the Python LiveKit agent worker to call back into the Anplexa API
 * for memory sync, call summaries, and event logging.
 *
 * Expects `Authorization: Bearer <INTERNAL_API_KEY>` header.
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
  if (providedKey !== internalKey) {
    res.status(403).json({ error: 'Invalid internal API key' });
    return;
  }

  next();
}
