/**
 * Chat Send Route — SSE streaming endpoint
 *
 * POST /api/chat/send
 * Body: { conversationId, message, userId, companionPersonaId }
 *
 * Opens an SSE stream, sends message to Letta agent, proxies tokens + activity events.
 * Auto-provisions Letta agent if conversation doesn't have one yet.
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

      const {
        lettaGateway,
        agentProvisioner,
        lettaAgentRepository,
      } = container.cradle;

      // 1. Resolve the Letta agent ID
      let lettaAgentId: string | null = null;

      // Try to find existing agent for this companion persona
      if (body.companionPersonaId && lettaAgentRepository) {
        try {
          const existing = await lettaAgentRepository.findByCompanionPersona(body.companionPersonaId);
          if (existing) {
            lettaAgentId = existing.lettaAgentId;
          }
        } catch (dbError) {
          console.error(`[ChatSend] DB lookup failed for persona ${body.companionPersonaId}:`, dbError);
        }
      }

      // Auto-provision if no agent exists
      if (!lettaAgentId && body.companionPersonaId && agentProvisioner) {
        try {
          const provisioned = await agentProvisioner.provisionCompanionAgent({
            userId,
            companionPersonaId: body.companionPersonaId,
            companionName: 'Companion', // Could be enriched from DB lookup
            conversationId: body.conversationId,
          });
          lettaAgentId = provisioned.lettaAgentId;
        } catch (err) {
          return res.status(500).json({
            error: 'Failed to provision agent',
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      if (!lettaAgentId) {
        return res.status(400).json({
          error: 'No agent available',
          message: 'Provide companionPersonaId to auto-provision an agent',
        });
      }

      // 2. Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      const sendSSE = (event: string, data: unknown) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      // 3. Stream from Letta
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
            sendSSE('token', { content: value });
          } else if (value.type === 'activity') {
            sendSSE('agent_activity', {
              status: value.status,
              toolName: 'toolName' in value ? value.toolName : undefined,
            });
          }
        }

        // 4. Check for media tool calls → trigger NativeMediaService
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
                  conversationId: body.conversationId,
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

        sendSSE('done', { status: 'completed' });
      } catch (err) {
        console.error(`[ChatSend] Stream error for agent ${lettaAgentId}:`, err);
        sendSSE('error', {
          message: err instanceof Error ? err.message : 'Stream error',
        });
      }

      res.end();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('[ChatSend] Unexpected error:', error);
      return res.status(500).json({
        error: 'An internal error occurred',
      });
    }
  });

  return router;
}
