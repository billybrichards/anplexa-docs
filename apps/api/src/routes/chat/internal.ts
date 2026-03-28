/**
 * Chat Internal Routes — endpoints called by the Python LiveKit agent worker.
 *
 * These use internal API key authentication (not JWT) because the caller
 * is a trusted backend service, not a user browser.
 *
 * POST /api/chat/conversations/:id/call-summary — Persist call transcript
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';
import { internalApiKeyMiddleware } from '../../middleware/internalApiKey.js';

const callSummarySchema = z.object({
  roomName: z.string().min(1),
  transcript: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.string().optional(),
    }),
  ),
  durationSeconds: z.number().nonnegative(),
  messageCount: z.number().nonnegative(),
});

export function createChatInternalRoutes(container: Container): Router {
  const router = Router();

  // ──────────────────────────────────────────────────────────────────────────
  // POST /conversations/:id/call-summary — Persist call summary
  // Called by Python LiveKit agent worker after a voice/video call ends.
  // Protected by internal API key (not JWT).
  // ──────────────────────────────────────────────────────────────────────────

  router.post(
    '/conversations/:id/call-summary',
    internalApiKeyMiddleware,
    async (req, res, next) => {
      try {
        const { id: conversationId } = req.params;
        const body = callSummarySchema.parse(req.body);

        const { messageRepository, lettaGateway, lettaAgentRepository } = container.cradle;

        // Persist transcript as messages
        const messages = body.transcript.map((entry) => ({
          conversationId,
          role: entry.role as 'user' | 'assistant',
          content: entry.content,
        }));

        if (messages.length > 0) {
          await messageRepository.bulkCreate(messages);
        }

        // Insert call summary into Letta archival memory (best effort)
        try {
          const agentRecord = await lettaAgentRepository.findByConversation(conversationId);
          if (agentRecord) {
            const summaryText = [
              `Voice call summary (${body.durationSeconds}s, ${body.messageCount} messages):`,
              ...body.transcript.map((t) => `${t.role}: ${t.content}`),
            ].join('\n');
            await lettaGateway.insertArchivalMemory(agentRecord.lettaAgentId, summaryText);
          }
        } catch (err) {
          console.warn('[ChatInternal] Failed to insert archival memory:', err);
        }

        return res.status(201).json({ persisted: messages.length });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        next(error);
      }
    },
  );

  return router;
}
