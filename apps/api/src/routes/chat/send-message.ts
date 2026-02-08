/**
 * Streaming Chat Route
 *
 * POST / - Sends a message and streams the AI response via Server-Sent Events.
 * Manually orchestrates message saving and streaming, bypassing the use case
 * to support real-time token delivery.
 */

import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';
import { createAuthMiddleware } from '../../middleware/auth.js';
import { ChatRequestSchema } from '@anplexa/contracts';
import type { SSEStartEvent, SSETokenEvent, SSEDoneEvent, SSEErrorEvent } from '@anplexa/contracts';
import { env } from '@anplexa/config';

function sendSSE(res: Response, data: SSEStartEvent | SSETokenEvent | SSEDoneEvent | SSEErrorEvent): void {
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
      
      // For guest users, require a stable guestId from the client (stored in localStorage)
      // The client should send this in a header or as part of the request
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

      // Track client disconnect
      let isClientConnected = true;
      const onDisconnect = () => {
        isClientConnected = false;
      };
      req.on('close', onDisconnect);
      req.on('error', onDisconnect);

      // Send start event - we'll update messageId after persisting the message
      sendSSE(res, { type: 'start', conversationId, messageId: 'pending' });

      // Stream AI response
      let fullResponse = '';
      let assistantMessage;
      try {
        const model = env.OLLAMA_GENERAL_MODEL;
        for await (const chunk of ollamaGateway.generateStream({ model, messages: chatMessages })) {
          // Check if client is still connected
          if (!isClientConnected) {
            // Client disconnected, stop generation and don't persist
            return;
          }
          
          fullResponse += chunk;
          sendSSE(res, { type: 'token', content: chunk });
        }

        // Only save assistant message if client is still connected
        if (!isClientConnected) {
          return;
        }

        // Save assistant message after streaming completes
        assistantMessage = await messageRepository.create({
          conversationId,
          role: 'assistant',
          content: fullResponse.trim(),
        });

        // Update conversation timestamp
        await conversationRepository.update(conversationId, {
          updatedAt: new Date().toISOString(),
        });

        // Send done event with the actual persisted message ID
        sendSSE(res, { type: 'done', conversationId, messageId: assistantMessage.id });
        res.end();
      } catch (streamError) {
        if (!isClientConnected) {
          return;
        }
        const errorMessage = streamError instanceof Error ? streamError.message : 'Streaming failed';
        sendSSE(res, { type: 'error', error: errorMessage });
        res.end();
      } finally {
        // Clean up event listeners
        req.off('close', onDisconnect);
        req.off('error', onDisconnect);
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
