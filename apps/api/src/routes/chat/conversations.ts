/**
 * Chat Conversations Routes — CRUD for conversations
 *
 * POST /api/chat/conversations — Create a conversation
 * GET  /api/chat/conversations — List user's conversations
 * GET  /api/chat/conversations/:id/messages — Get messages for a conversation
 * GET  /api/chat/messages-by-companion/:companionPersonaId — Get messages by companion persona
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';

const createConversationSchema = z.object({
  title: z.string().optional(),
  companionPersonaId: z.string().optional(),
});

export function createChatConversationRoutes(container: Container): Router {
  const router = Router();

  /**
   * POST /api/chat/conversations — Create a new conversation
   */
  router.post('/conversations', async (req, res, next) => {
    try {
      const body = createConversationSchema.parse(req.body);
      const userId = req.user?.sub || 'guest';
      const conversationRepository = container.cradle.conversationRepository;
      if (!conversationRepository) {
        return res.status(501).json({ error: 'Conversations not available' });
      }

      const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const conversation = await conversationRepository.create({
        id,
        userId,
        title: body.title || 'New Conversation',
      });

      return res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  });

  /**
   * GET /api/chat/conversations?userId=X — List conversations
   */
  router.get('/conversations', async (req, res, next) => {
    try {
      const userId = req.user?.sub || (req.query.userId as string) || 'guest';

      const conversationRepository = container.cradle.conversationRepository;
      const conversations = await conversationRepository.getByUserId(userId);

      return res.json(conversations);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/chat/conversations/:id/messages — Get message history for a conversation
   */
  router.get('/conversations/:id/messages', async (req, res, next) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const { messageRepository } = container.cradle;

      // Fetch from local DB (messages are now persisted by send.ts)
      const messages = await messageRepository.getByConversationId(id, { limit });
      return res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/chat/messages-by-companion/:companionPersonaId — Get chat history for a companion
   *
   * Looks up the conversation associated with a companionPersonaId and returns messages.
   * This is the primary endpoint the frontend uses to load chat history.
   */
  router.get('/messages-by-companion/:companionPersonaId', async (req, res, next) => {
    try {
      const { companionPersonaId } = req.params;
      const userId = req.user?.sub || (req.query.userId as string) || 'guest';
      const limit = parseInt(req.query.limit as string) || 100;

      const { conversationRepository, messageRepository } = container.cradle;

      if (!conversationRepository || !messageRepository) {
        return res.status(501).json({ error: 'Chat persistence not available' });
      }

      // Find conversation for this companion persona
      const userConversations = await conversationRepository.getByUserId(userId);
      const conversation = userConversations.find(
        (c: { companionPersonaId?: string | null }) => c.companionPersonaId === companionPersonaId
      );

      if (!conversation) {
        // No conversation yet — return empty array (first chat)
        return res.json({ conversationId: null, messages: [] });
      }

      const messages = await messageRepository.getByConversationId(conversation.id, { limit });

      return res.json({
        conversationId: conversation.id,
        messages,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
