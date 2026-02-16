/**
 * Chat Conversations Routes — CRUD for conversations
 *
 * POST /api/chat/conversations — Create a conversation
 * GET  /api/chat/conversations — List user's conversations
 * GET  /api/chat/conversations/:id/messages — Get messages
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';

const createConversationSchema = z.object({
  userId: z.string().optional().default('guest'),
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
      const conversationRepository = container.cradle.conversationRepository;
      if (!conversationRepository) {
        return res.status(501).json({ error: 'Conversations not available' });
      }

      const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const conversation = await conversationRepository.create({
        id,
        userId: body.userId,
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
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: 'userId query parameter required' });
      }

      const conversationRepository = container.cradle.conversationRepository;
      const conversations = await conversationRepository.getByUserId(userId);

      return res.json(conversations);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/chat/conversations/:id/messages — Get message history
   */
  router.get('/conversations/:id/messages', async (req, res, next) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const { lettaGateway, lettaAgentRepository } = container.cradle;

      // Find the Letta agent for this conversation
      let lettaAgentId: string | null = null;
      if (lettaAgentRepository) {
        try {
          const agentRecord = await lettaAgentRepository.findByConversation(id);
          if (agentRecord) {
            lettaAgentId = agentRecord.lettaAgentId;
          }
        } catch {
          // DB not available
        }
      }

      if (lettaAgentId) {
        // Fetch from Letta server
        const messages = await lettaGateway.getMessages(lettaAgentId, limit);
        return res.json(messages);
      }

      // Fall back to local DB
      const messageRepository = container.cradle.messageRepository;
      const messages = await messageRepository.getByConversationId(id, { limit });
      return res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
