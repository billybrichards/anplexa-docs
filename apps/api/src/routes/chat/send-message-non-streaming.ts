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
import { env } from '@anplexa/config';

export function createNonStreamingRoutes(container: Container): Router {
  const router = Router();
  const { useCases, conversationRepository } = container.cradle;
  const { optionalAuthMiddleware } = createAuthMiddleware(container);

  router.post('/non-streaming', optionalAuthMiddleware, async (req, res, next) => {
    try {
      const body = ChatRequestSchema.parse(req.body);

      const { randomUUID } = await import('crypto');
      
      // For guest users, require a stable guestId from the client (stored in localStorage)
      let userId: string;
      if (req.user?.sub) {
        userId = req.user.sub;
      } else {
        // Get guestId from header or generate new one for first-time guests
        const guestId = req.headers['x-guest-id'] as string;
        if (!guestId) {
          return res.status(400).json({ 
            error: 'Guest users must provide a stable guest ID via X-Guest-Id header' 
          });
        }
        userId = `guest-${guestId}`;
      }

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
        model: env.OLLAMA_GENERAL_MODEL,
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
