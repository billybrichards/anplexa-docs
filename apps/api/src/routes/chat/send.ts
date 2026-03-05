/**
 * Chat Send Route — SSE streaming endpoint
 *
 * POST /api/chat/send
 * Body: { conversationId?, message, userId?, companionPersonaId }
 *
 * Opens an SSE stream, sends message to Letta agent, proxies tokens + activity events.
 * Auto-provisions Letta agent if companion doesn't have one yet.
 *
 * FIX: Now creates/reuses conversations, persists messages to DB after stream completes.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';

const sendSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1),
  companionPersonaId: z.string().optional(),
});

export function createChatSendRoutes(container: Container): Router {
  const router = Router();

  router.post('/send', async (req, res) => {
    try {
      const body = sendSchema.parse(req.body);
      const userId = req.user?.sub || 'guest';

      console.log('[ChatSend] Incoming request:', {
        userId,
        companionPersonaId: body.companionPersonaId || '(none)',
        conversationId: body.conversationId || '(none)',
        messageLength: body.message.length,
      });

      const {
        lettaGateway,
        agentProvisioner,
        lettaAgentRepository,
        conversationRepository,
        messageRepository,
      } = container.cradle;

      // ──────────────────────────────────────────────────────────────────
      // 0. Validate companionPersonaId is a real DB ID (not preview_*)
      // ──────────────────────────────────────────────────────────────────
      if (body.companionPersonaId && body.companionPersonaId.startsWith('preview_')) {
        console.error('[ChatSend] Received preview ID — frontend must call /api/companion/save first');
        return res.status(400).json({
          error: 'Invalid companionPersonaId',
          message: 'The companionPersonaId is a temporary preview ID. Call POST /api/companion/save first to persist the companion.',
        });
      }

      // ──────────────────────────────────────────────────────────────────
      // 1. Resolve or create a conversation
      // ──────────────────────────────────────────────────────────────────
      let conversationId = body.conversationId || null;

      if (!conversationId && body.companionPersonaId && conversationRepository) {
        // Look for an existing conversation for this companion persona
        try {
          const userConversations = await conversationRepository.getByUserId(userId);
          const existingConv = userConversations.find(
            (c: { companionPersonaId?: string | null }) => c.companionPersonaId === body.companionPersonaId
          );
          if (existingConv) {
            conversationId = existingConv.id;
            console.log('[ChatSend] Found existing conversation:', conversationId);
          }
        } catch (err) {
          console.warn('[ChatSend] Could not search for existing conversation:', err);
        }
      }

      if (!conversationId && conversationRepository) {
        // Create a new conversation with companion persona link
        try {
          const convId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const conv = await conversationRepository.create({
            id: convId,
            userId,
            title: 'Chat',
            companionPersonaId: body.companionPersonaId || null,
          });

          conversationId = conv.id;
          console.log('[ChatSend] Created new conversation:', conversationId);
        } catch (err) {
          console.warn('[ChatSend] Failed to create conversation:', err);
        }
      }

      // ──────────────────────────────────────────────────────────────────
      // 2. Resolve the Letta agent ID
      // ──────────────────────────────────────────────────────────────────
      let lettaAgentId: string | null = null;

      // Try to find existing agent for this companion persona
      if (body.companionPersonaId && lettaAgentRepository) {
        try {
          console.log('[ChatSend] Looking up existing agent for persona:', body.companionPersonaId);
          const existing = await lettaAgentRepository.findByCompanionPersona(body.companionPersonaId);
          if (existing) {
            lettaAgentId = existing.lettaAgentId;
            console.log('[ChatSend] Found existing agent:', lettaAgentId);
          } else {
            console.log('[ChatSend] No existing agent found for persona');
          }
        } catch (dbError) {
          console.error(`[ChatSend] DB lookup failed for persona ${body.companionPersonaId}:`, dbError);
        }
      }

      // Auto-provision if no agent exists
      if (!lettaAgentId && body.companionPersonaId && agentProvisioner) {
        try {
          console.log('[ChatSend] Auto-provisioning new agent for persona:', body.companionPersonaId);

          // Try to get companion name from the persona record
          let companionName = 'Companion';
          try {
            const { companionPersonaRepository } = container.cradle;
            if (companionPersonaRepository) {
              const persona = await companionPersonaRepository.getById(body.companionPersonaId);
              if (persona) {
                companionName = persona.name;
              }
            }
          } catch {
            // Use default name
          }

          const provisioned = await agentProvisioner.provisionCompanionAgent({
            userId,
            companionPersonaId: body.companionPersonaId,
            companionName,
            conversationId: conversationId || undefined,
          });
          lettaAgentId = provisioned.lettaAgentId;
          console.log('[ChatSend] Provisioned new agent:', lettaAgentId);
        } catch (err) {
          console.error('[ChatSend] Agent provisioning failed:', err);
          return res.status(500).json({
            error: 'Failed to provision agent',
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      if (!lettaAgentId) {
        console.error('[ChatSend] No agent resolved. companionPersonaId:', body.companionPersonaId);
        return res.status(400).json({
          error: 'No agent available',
          message: 'Provide a valid companionPersonaId to auto-provision an agent',
        });
      }

      console.log('[ChatSend] Using agent:', lettaAgentId, '— starting SSE stream');

      // ──────────────────────────────────────────────────────────────────
      // 3. Set up SSE headers
      // ──────────────────────────────────────────────────────────────────
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      const sendSSE = (event: string, data: unknown) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      // Send conversationId to the client so it can track it
      if (conversationId) {
        sendSSE('conversation', { conversationId });
      }

      // ──────────────────────────────────────────────────────────────────
      // 4. Stream from Letta
      // ──────────────────────────────────────────────────────────────────
      let accumulatedResponse = '';

      try {
        console.log('[ChatSend] Sending message to Letta agent:', lettaAgentId);
        const stream = lettaGateway.sendMessageStream(lettaAgentId, body.message);
        let streamResult: { detectedToolCalls?: Array<{ toolName: string; toolArgs: Record<string, unknown> }> } | undefined;

        while (true) {
          const { done, value } = await stream.next();
          if (done) {
            streamResult = value;
            break;
          }

          if (typeof value === 'string') {
            sendSSE('token', { content: value });
            accumulatedResponse += value;
          } else if (value.type === 'activity') {
            sendSSE('agent_activity', {
              status: value.status,
              toolName: 'toolName' in value ? value.toolName : undefined,
            });
          }
        }

        // 5. Check for media tool calls → trigger NativeMediaService
        const { nativeMediaService } = container.cradle;
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
                  conversationId: conversationId || undefined,
                  companionId: body.companionPersonaId,
                });

                sendSSE('media_started', {
                  generationId: genResult.generationId,
                  comfyRequestId: genResult.comfyRequestId,
                  type: mediaType,
                  status: genResult.status,
                });
              } catch (mediaError) {
                console.error(`[ChatSend] Media generation failed for ${mediaType}:`, mediaError);
                sendSSE('media_started', {
                  type: mediaType,
                  status: 'failed',
                  error: 'Failed to trigger media generation',
                });
              }
            }
          }
        }

        // ──────────────────────────────────────────────────────────────────
        // 6. Persist messages to local DB (user message + assistant response)
        // ──────────────────────────────────────────────────────────────────
        if (conversationId && messageRepository && accumulatedResponse) {
          try {
            await messageRepository.bulkCreate([
              {
                conversationId,
                role: 'user',
                content: body.message,
              },
              {
                conversationId,
                role: 'assistant',
                content: accumulatedResponse,
              },
            ]);
            console.log('[ChatSend] Persisted user + assistant messages to DB for conversation:', conversationId);
          } catch (dbErr) {
            console.warn('[ChatSend] Failed to persist messages:', dbErr);
          }
        }

        console.log('[ChatSend] Stream completed for agent:', lettaAgentId);
        sendSSE('done', { status: 'completed', conversationId });
      } catch (err) {
        console.error(`[ChatSend] Stream error for agent ${lettaAgentId}:`, {
          error: err instanceof Error ? err.message : err,
          stack: err instanceof Error ? err.stack : undefined,
        });
        sendSSE('error', {
          message: err instanceof Error ? err.message : 'Stream error',
        });
      }

      res.end();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[ChatSend] Validation error:', JSON.stringify(error.errors));
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('[ChatSend] Unexpected error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return res.status(500).json({
        error: 'An internal error occurred',
      });
    }
  });

  return router;
}
