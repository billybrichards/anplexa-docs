/**
 * Streaming Chat Route
 *
 * POST / - Sends a message and streams the AI response via Server-Sent Events.
 * Manually orchestrates message saving and streaming, bypassing the use case
 * to support real-time token delivery.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';
import { createAuthMiddleware } from '../../middleware/auth.js';
import { ChatRequestSchema } from '@anplexa/contracts';
import type { SSEStartEvent, SSETokenEvent, SSEDoneEvent, SSEErrorEvent } from '@anplexa/contracts';

function sendSSE(res: any, data: SSEStartEvent | SSETokenEvent | SSEDoneEvent | SSEErrorEvent): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function createStreamingRoutes(container: Container): Router {
  const router = Router();
  const {
    conversationRepository,
    messageRepository,
    ollamaGateway,
    companionPersonaRepository,
  } = container.cradle;
  const { optionalAuthMiddleware } = createAuthMiddleware(container);

  router.post('/', optionalAuthMiddleware, async (req, res, next) => {
    try {
      const body = ChatRequestSchema.parse(req.body);

      const { randomUUID } = await import('crypto');
      const userId = req.user?.sub || `guest-${randomUUID()}`;

      // Create or resolve conversation
      let conversationId = body.conversationId;
      if (body.newChat || !conversationId) {
        const conversation = await conversationRepository.create({
          id: randomUUID(),
          userId,
          title: null,
        });
        conversationId = conversation.id;
      } else {
        // Verify conversation exists and user has access
        const conversation = await conversationRepository.getById(conversationId);
        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
        if (conversation.userId !== userId) {
          return res.status(403).json({ error: 'Unauthorized access to conversation' });
        }
      }

      // Save user message
      await messageRepository.create({
        conversationId,
        role: 'user',
        content: body.message.trim(),
      });

      // Get conversation history for context
      const previousMessages = await messageRepository.getByConversationId(
        conversationId,
        { limit: 10 }
      );

      // Build system prompt
      let systemPrompt = 'You are Violet, a helpful AI companion.';
      if (req.user?.sub) {
        const persona = await companionPersonaRepository.getActiveByUserId(req.user.sub);
        if (persona) {
          systemPrompt = persona.systemPrompt;
        }
      }

      // Build chat messages for AI
      const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      const historyMessages = previousMessages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        }));
      chatMessages.push(...historyMessages);

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const messageId = randomUUID();

      // Send start event
      sendSSE(res, { type: 'start', conversationId, messageId });

      // Stream AI response
      let fullResponse = '';
      try {
        const model = 'darkplanet-general:latest';
        for await (const chunk of ollamaGateway.generateStream({ model, messages: chatMessages })) {
          fullResponse += chunk;
          sendSSE(res, { type: 'token', content: chunk });
        }

        // Save assistant message after streaming completes
        await messageRepository.create({
          conversationId,
          role: 'assistant',
          content: fullResponse.trim(),
        });

        // Update conversation timestamp
        await conversationRepository.update(conversationId, {
          updatedAt: new Date().toISOString(),
        });

        // Send done event
        sendSSE(res, { type: 'done', conversationId, messageId });
        res.end();
      } catch (streamError) {
        const errorMessage = streamError instanceof Error ? streamError.message : 'Streaming failed';
        sendSSE(res, { type: 'error', error: errorMessage });
        res.end();
      }
    } catch (error) {
      // If headers haven't been sent yet, return JSON error
      if (!res.headersSent) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Validation error',
            details: error.errors,
          });
        }
        return next(error);
      }
      // If already streaming, send SSE error
      sendSSE(res, { type: 'error', error: 'Something went wrong' });
      res.end();
    }
  });

  return router;
}
