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
  userId: z.string().optional().default('guest'),
  companionPersonaId: z.string().optional(),
});

export function createChatSendRoutes(container: Container): Router {
  const router = Router();

  router.post('/send', async (req, res) => {
    try {
      const body = sendSchema.parse(req.body);

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
        } catch {
          // DB not available — fall through to provisioning
        }
      }

      // Auto-provision if no agent exists
      if (!lettaAgentId && body.companionPersonaId && agentProvisioner) {
        try {
          const provisioned = await agentProvisioner.provisionCompanionAgent({
            userId: body.userId,
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

        for await (const chunk of stream) {
          if (typeof chunk === 'string') {
            // Token
            sendSSE('token', { content: chunk });
          } else if (chunk.type === 'activity') {
            // Agent activity (thinking, tool_call, tool_return, responding)
            sendSSE('agent_activity', {
              status: chunk.status,
              toolName: 'toolName' in chunk ? chunk.toolName : undefined,
            });
          }
        }

        sendSSE('done', { status: 'completed' });
      } catch (err) {
        sendSSE('error', {
          message: err instanceof Error ? err.message : 'Stream error',
        });
      }

      res.end();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
