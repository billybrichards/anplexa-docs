/**
 * Activity Logs Routes
 *
 * POST /api/logs — Batched frontend event ingestion.
 * Accepts up to 50 events per request, responds 202, writes async.
 */

import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { Container } from '../../container.js';
import { createAuthMiddleware } from '../../middleware/auth.js';

const eventSchema = z.object({
  eventType: z.string().min(1).max(50),
  eventName: z.string().min(1).max(200),
  sessionId: z.string().max(100).optional(),
  requestId: z.string().max(100).optional(),
  method: z.string().max(10).optional(),
  path: z.string().max(500).optional(),
  statusCode: z.number().int().optional(),
  durationMs: z.number().int().nonnegative().optional(),
  metadata: z.string().max(5000).optional(),
  errorMessage: z.string().max(2000).optional(),
  referrer: z.string().max(500).optional(),
});

const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(50),
});

export function createLogsRoutes(container: Container): Router {
  const router = Router();
  const { optionalAuthMiddleware } = createAuthMiddleware(container);
  const { activityLogRepository } = container.cradle;

  router.post('/', optionalAuthMiddleware, (req, res) => {
    const parsed = batchSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const userId = req.user?.sub ?? null;
    const userAgent = req.headers['user-agent'] ?? null;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ?? req.ip ?? null;

    const records = parsed.data.events.map((event) => ({
      id: randomUUID(),
      userId,
      sessionId: event.sessionId ?? null,
      eventType: event.eventType,
      eventName: event.eventName,
      source: 'frontend' as const,
      requestId: event.requestId ?? null,
      method: event.method ?? null,
      path: event.path ?? null,
      statusCode: event.statusCode ?? null,
      durationMs: event.durationMs ?? null,
      metadata: event.metadata ?? null,
      errorMessage: event.errorMessage ?? null,
      errorStack: null,
      userAgent,
      ipAddress,
      referrer: event.referrer ?? null,
    }));

    // Fire-and-forget — respond immediately
    activityLogRepository.createBatch(records).catch((err: unknown) => {
      console.error('[Logs] Failed to persist activity events:', err);
    });

    return res.status(202).json({ accepted: records.length });
  });

  return router;
}
