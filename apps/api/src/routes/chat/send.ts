/**
 * Chat Send Route — SSE streaming endpoint
 *
 * POST /api/chat/send
 * Body: { conversationId, message, companionPersonaId }
 *
 * Requires JWT auth (applied at router level). Rate-limited for free-tier users.
 * Opens an SSE stream, sends message to Letta agent, proxies tokens + activity events.
 * Uses RouteToAgentUseCase for agent resolution with auto-provision fallback.
 * Integrates ChatActionStreamFilter to clean LLM output before sending to client.
 * Persists user + assistant messages to local DB.
 */

import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { Container } from '../../container.js';
import {
  RouteToAgentUseCase,
  AgentNotFoundError,
} from '@anplexa/core';
import { ChatActionStreamFilter } from '@anplexa/services';
import type {
  SSEStartEvent,
  SSETokenEvent,
  SSEActivityEvent,
  SSEDoneEvent,
  SSEErrorEvent,
} from '@anplexa/contracts';

const sendSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(10000),
  companionPersonaId: z.string().optional(),
});

export function createChatSendRoutes(container: Container): Router {
  const router = Router();

  router.post('/send', async (req, res) => {
    try {
      const body = sendSchema.parse(req.body);
      const userId = req.user!.sub;

      const {
        lettaGateway,
        agentProvisioner,
        lettaAgentRepository,
        conversationRepository,
        messageRepository,
        nativeMediaService,
        companionPersonaRepository,
        birthChartRepository,
      } = container.cradle;

      // 1. Resolve or create conversation
      let conversationId = body.conversationId;
      if (conversationId) {
        // Verify the conversation belongs to this user
        const existingConv = await conversationRepository.getById(conversationId);
        if (!existingConv) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
        if (existingConv.userId !== userId) {
          return res.status(403).json({ error: 'Not authorized to access this conversation' });
        }
      } else {
        const conv = await conversationRepository.create({
          id: `conv_${randomUUID()}`,
          userId,
          title: body.message.substring(0, 60),
        });
        conversationId = conv.id;
      }

      // 2. Resolve the Letta agent via RouteToAgentUseCase
      let lettaAgentId: string | null = null;

      try {
        const routeToAgent = new RouteToAgentUseCase(
          conversationRepository,
          lettaAgentRepository,
        );
        const routeResult = await routeToAgent.execute({
          conversationId,
          userId,
          companionPersonaId: body.companionPersonaId,
        });
        lettaAgentId = routeResult.lettaAgentId;
      } catch (err) {
        if (err instanceof AgentNotFoundError) {
          // 3. Auto-provision if no agent found
          if (body.companionPersonaId && agentProvisioner) {
            try {
              const persona = await companionPersonaRepository.getById(body.companionPersonaId);
              if (!persona) {
                return res.status(404).json({ error: 'Companion persona not found' });
              }

              const chartId = persona.birthChartId;
              const birthChart = chartId
                ? await birthChartRepository.getById(chartId)
                : await birthChartRepository.getActiveByUserId(userId);

              const provisioned = await agentProvisioner.provisionCompanionAgent({
                userId,
                companionPersonaId: body.companionPersonaId,
                companion: persona,
                chart: birthChart?.chartData ?? null,
                userName: birthChart?.displayName,
                conversationId,
              });
              lettaAgentId = provisioned.lettaAgentId;

              // Link agent to conversation for future fast-path
              await conversationRepository.update(conversationId, {
                lettaAgentId: provisioned.lettaAgentId,
                companionPersonaId: body.companionPersonaId,
              });
            } catch (provisionErr) {
              console.error('[ChatSend] Agent provisioning failed:', provisionErr);
              return res.status(500).json({
                error: 'Failed to provision agent',
                message: provisionErr instanceof Error ? provisionErr.message : 'Unknown error',
              });
            }
          }
        } else {
          throw err;
        }
      }

      if (!lettaAgentId) {
        return res.status(400).json({
          error: 'No agent available',
          message: 'Provide companionPersonaId to auto-provision an agent',
        });
      }

      // 4. Persist user message (await to ensure it's saved before streaming)
      try {
        await messageRepository.create({
          conversationId,
          role: 'user',
          content: body.message,
        });
      } catch (err) {
        console.error('[ChatSend] Failed to persist user message:', err);
      }

      // 5. Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      const sendSSE = (event: string, data: Record<string, unknown>) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      // 6. Emit start event
      const assistantMessageId = randomUUID();
      sendSSE('start', {
        type: 'start',
        conversationId,
        messageId: assistantMessageId,
      } satisfies SSEStartEvent);

      // 7. Stream from Letta with ChatActionStreamFilter
      const streamFilter = new ChatActionStreamFilter('text');
      let accumulatedContent = '';
      let chunkCount = 0;

      try {
        const stream = lettaGateway.sendMessageStream(lettaAgentId, body.message);
        let streamResult: { detectedToolCalls?: Array<{ toolName: string; toolArgs: Record<string, unknown> }> } | undefined;

        while (true) {
          const { done, value } = await stream.next();
          if (done) {
            streamResult = value;
            break;
          }

          if (typeof value === 'string') {
            // Apply stream filter to clean LLM output
            const filtered = streamFilter.process(value);
            if (filtered) {
              sendSSE('token', { type: 'token', content: filtered } satisfies SSETokenEvent);
              accumulatedContent += filtered;
              chunkCount++;
            }
          } else if (value.type === 'activity') {
            sendSSE('activity', {
              type: 'activity',
              status: value.status,
              toolName: 'toolName' in value ? (value.toolName as string) : undefined,
            } satisfies SSEActivityEvent);
          }
        }

        // Flush any remaining buffered content from the filter
        const flushed = streamFilter.flush();
        if (flushed) {
          sendSSE('token', { type: 'token', content: flushed } satisfies SSETokenEvent);
          accumulatedContent += flushed;
        }

        // 8. Check for media tool calls -> trigger NativeMediaService
        const mediaToolNames = ['generate_image', 'generate_video'];

        if (streamResult?.detectedToolCalls && nativeMediaService) {
          for (const toolCall of streamResult.detectedToolCalls) {
            if (mediaToolNames.includes(toolCall.toolName)) {
              const mediaType = toolCall.toolName === 'generate_image' ? 'image' : 'video';
              const prompt = (toolCall.toolArgs.prompt as string) || '';

              try {
                const genResult = await nativeMediaService.triggerGeneration({
                  type: mediaType as 'image' | 'video',
                  enhancedPrompt: prompt,
                  userId,
                  conversationId,
                  companionId: body.companionPersonaId,
                });

                sendSSE('media_started', {
                  type: 'media_started',
                  generationId: genResult.generationId,
                  comfyRequestId: genResult.comfyRequestId,
                  mediaType,
                  status: genResult.status,
                });
              } catch (mediaError) {
                console.error(`[ChatSend] Media generation failed for ${mediaType}:`, mediaError);
                sendSSE('media_started', {
                  type: 'media_started',
                  mediaType,
                  status: 'failed',
                  error: 'Failed to trigger media generation',
                });
              }
            }
          }
        }

        // 9. Persist assistant message (fire-and-forget)
        if (accumulatedContent) {
          messageRepository.create({
            id: assistantMessageId,
            conversationId,
            role: 'assistant',
            content: accumulatedContent,
          }).catch((err: unknown) => {
            console.warn('[ChatSend] Failed to persist assistant message:', err);
          });
        }

        // 10. Emit done event
        sendSSE('done', {
          type: 'done',
          conversationId,
          messageId: assistantMessageId,
          chunkCount,
        } satisfies SSEDoneEvent);
      } catch (err) {
        console.error(`[ChatSend] Stream error for agent ${lettaAgentId}:`, err);
        sendSSE('error', {
          type: 'error',
          error: err instanceof Error ? err.message : 'Stream error',
        } satisfies SSEErrorEvent);
      }

      res.end();
    } catch (error) {
      // If headers already sent (SSE in progress), just close
      if (res.headersSent) {
        res.end();
        return;
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('[ChatSend] Unexpected error:', error);
      return res.status(500).json({ error: 'An internal error occurred' });
    }
  });

  return router;
}
