/**
 * Chat Conversations Routes — CRUD + memory
 *
 * POST   /api/chat/conversations               — Create a conversation
 * GET    /api/chat/conversations               — List user's conversations
 * GET    /api/chat/conversations/:id/messages   — Get messages
 * DELETE /api/chat/conversations/:id            — Delete a conversation
 * GET    /api/chat/conversations/:id/memory     — Get agent memory blocks
 *
 * NOTE: POST /conversations/:id/call-summary has been moved to internal.ts
 * (uses internal API key auth instead of JWT).
 */

import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { Container } from '../../container.js';
import { sanitizeAssistantOutput } from '@anplexa/services';

const createConversationSchema = z.object({
  title: z.string().optional(),
  companionPersonaId: z.string().optional(),
});

export function createChatConversationRoutes(container: Container): Router {
  const router = Router();

  // ──────────────────────────────────────────────────────────────────────────
  // POST /conversations — Create a new conversation
  // ──────────────────────────────────────────────────────────────────────────

  router.post('/conversations', async (req, res, next) => {
    try {
      const body = createConversationSchema.parse(req.body);
      const userId = req.user!.sub;

      const { conversationRepository } = container.cradle;

      const id = `conv_${randomUUID()}`;
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

  // ──────────────────────────────────────────────────────────────────────────
  // GET /conversations — List conversations for the authenticated user
  // ──────────────────────────────────────────────────────────────────────────

  router.get('/conversations', async (req, res, next) => {
    try {
      const userId = req.user!.sub;
      const { conversationRepository } = container.cradle;
      const conversations = await conversationRepository.getByUserId(userId);
      return res.json(conversations);
    } catch (error) {
      next(error);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GET /conversations/:id/messages — Get message history
  // ──────────────────────────────────────────────────────────────────────────

  router.get('/conversations/:id/messages', async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user!.sub;
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 500);

      const { conversationRepository, lettaGateway, lettaAgentRepository, messageRepository } = container.cradle;

      // Verify ownership
      const conversation = await conversationRepository.getById(id);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      if (conversation.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to access this conversation' });
      }

      // Find the Letta agent for this conversation
      let lettaAgentId: string | null = null;
      try {
        const agentRecord = await lettaAgentRepository.findByConversation(id);
        if (agentRecord) {
          lettaAgentId = agentRecord.lettaAgentId;
        }
      } catch {
        // DB lookup failed — fall through to local
      }

      if (lettaAgentId) {
        // Fetch from Letta server and sanitize
        const messages = await lettaGateway.getMessages(lettaAgentId, limit);
        return res.json(
          messages.map((m) => ({
            ...m,
            content: m.role === 'assistant' ? sanitizeAssistantOutput(m.content) : m.content,
          })),
        );
      }

      // Fall back to local DB
      const messages = await messageRepository.getByConversationId(id, { limit });
      return res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DELETE /conversations/:id — Delete a conversation
  // ──────────────────────────────────────────────────────────────────────────

  router.delete('/conversations/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user!.sub;

      const { conversationRepository, lettaGateway, lettaAgentRepository } = container.cradle;

      // Verify ownership
      const conversation = await conversationRepository.getById(id);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      if (conversation.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this conversation' });
      }

      // Optionally delete the Letta agent (best effort)
      try {
        const agentRecord = await lettaAgentRepository.findByConversation(id);
        if (agentRecord) {
          await lettaGateway.deleteAgent(agentRecord.lettaAgentId);
          await lettaAgentRepository.deactivate(agentRecord.id);
        }
      } catch (err) {
        console.warn('[Conversations] Failed to clean up Letta agent:', err);
      }

      await conversationRepository.delete(id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GET /conversations/:id/memory — Get Letta agent memory blocks
  // ──────────────────────────────────────────────────────────────────────────

  router.get('/conversations/:id/memory', async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user!.sub;

      const { conversationRepository, lettaGateway, lettaAgentRepository } = container.cradle;

      // Verify ownership
      const conversation = await conversationRepository.getById(id);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      if (conversation.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to access this conversation' });
      }

      const agentRecord = await lettaAgentRepository.findByConversation(id);
      if (!agentRecord) {
        return res.status(404).json({ error: 'No agent found for this conversation' });
      }

      // Fetch key memory blocks
      const blockLabels = ['persona', 'human', 'user_model', 'companion_preferences', 'relationship_state'];
      const blocks = await Promise.all(
        blockLabels.map(async (label) => {
          const block = await lettaGateway.getAgentMemoryBlockByLabel(agentRecord.lettaAgentId, label);
          return block;
        }),
      );

      const memoryBlocks = blocks
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map((b) => ({
          label: b.label,
          value: b.value,
          limit: b.limit,
        }));

      return res.json({ agentId: agentRecord.lettaAgentId, blocks: memoryBlocks });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
