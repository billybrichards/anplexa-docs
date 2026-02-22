/**
 * Activity Logger Middleware
 *
 * Captures backend API requests as activity log entries.
 * Generates/propagates X-Request-ID for frontend-backend correlation.
 * Fire-and-forget DB writes — never delays the response.
 */

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import type { Container } from '../container.js';

const SKIP_PATHS = ['/health', '/admin'];

export function createActivityLoggerMiddleware(container: Container) {
  const { activityLogRepository } = container.cradle;
  let disabled = false;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip if logging is disabled (table doesn't exist) or path should be skipped
    if (disabled || SKIP_PATHS.some((p) => req.path.startsWith(p))) {
      return next();
    }

    // Read or generate request ID
    const requestId =
      (req.headers['x-request-id'] as string) || randomUUID();
    res.setHeader('X-Request-ID', requestId);

    const startTime = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startTime;

      activityLogRepository
        .create({
          id: randomUUID(),
          userId: req.user?.sub ?? null,
          sessionId: (req.headers['x-session-id'] as string) ?? null,
          eventType: 'api_request',
          eventName: `${req.method} ${req.path}`,
          source: 'backend',
          requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs,
          userAgent: req.headers['user-agent'] ?? null,
          ipAddress: (req.headers['x-forwarded-for'] as string) ?? req.ip ?? null,
          referrer: req.headers.referer ?? null,
        })
        .catch((err: unknown) => {
          // Disable logging if the table doesn't exist to avoid spam
          console.warn('[ActivityLogger] Disabling — activity_logs table may not exist:', String(err));
          disabled = true;
        });
    });

    next();
  };
}
