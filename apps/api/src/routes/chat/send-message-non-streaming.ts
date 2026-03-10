/**
 * Non-Streaming Chat Route
 *
 * POST /non-streaming - Sends a message and returns the complete AI response as JSON.
 * Uses the existing SendMessageUseCase for orchestration.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';
import { createAuthMiddleware } from '../../middleware/auth.js';
import { ChatRequestSchema } from '@anplexa/contracts';

export function createNonStreamingRoutes(container: Container): Router {
  const router = Router();
  const { useCases, conversationRepository } = container.cradle;
  const { optionalAuthMiddleware } = createAuthMiddleware(container);

  router.post('/non-streaming', optionalAuthMiddleware, async (req, res, next) => {
    try {
      const body = ChatRequestSchema.parse(req.body);

      const { randomUUID } = await import('crypto');
      const userId = req.user?.sub || `guest-${randomUUID()}`;

      // Create conversation if needed
      let conversationId = body.conversationId;
      if (body.newChat || !conversationId) {
        const conversation = await conversationRepository.create({
          id: randomUUID(),
          userId,
          title: null,
        });
        conversationId = conversation.id;
      }

      if (!useCases.sendMessage) {
        return res.status(503).json({ error: 'Chat service unavailable' });
      }

      const result = await useCases.sendMessage.execute({
        conversationId,
        userId,
        content: body.message,
      });

      res.json({
        conversationId: result.conversationId,
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      if (error instanceof Error) {
        if (error.name === 'ConversationNotFoundError') {
          return res.status(404).json({ error: error.message });
        }
        if (error.name === 'UnauthorizedConversationAccessError') {
          return res.status(403).json({ error: error.message });
        }
        if (error.name === 'EmptyMessageError') {
          return res.status(400).json({ error: error.message });
        }
        if (error.name === 'AIServiceError') {
          return res.status(500).json({ error: 'AI service error' });
        }
      }
      next(error);
    }
  });

  return router;
}
