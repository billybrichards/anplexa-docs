/**
 * Chat Feedback Route
 *
 * POST /feedback - Stores user feedback on AI responses.
 * Requires authentication.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';
import { createAuthMiddleware } from '../../middleware/auth.js';

const feedbackSchema = z.object({
  messageId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export function createFeedbackRoutes(container: Container): Router {
  const router = Router();
  const { userFeedbackRepository } = container.cradle;
  const { authMiddleware } = createAuthMiddleware(container);

  router.post('/feedback', authMiddleware, async (req, res, next) => {
    try {
      const body = feedbackSchema.parse(req.body);

      const { randomUUID } = await import('crypto');
      const feedback = await userFeedbackRepository.create({
        id: randomUUID(),
        userId: req.user!.sub,
        type: 'chat_response',
        content: JSON.stringify({
          messageId: body.messageId,
          rating: body.rating,
          comment: body.comment,
        }),
      });

      res.json({ success: true, feedbackId: feedback.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  });

  return router;
}
