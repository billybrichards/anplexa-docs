/**
 * Companion Provisioning Routes
 *
 * POST /api/companion/provision — Provision a Letta agent for a companion persona.
 * Fetches persona + birth chart, passes domain objects to AgentProvisioner,
 * creates a conversation linked to the agent.
 */

import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { Container } from '../../container.js';
import { createAuthMiddleware } from '../../middleware/auth.js';

const provisionSchema = z.object({
  companionPersonaId: z.string().min(1),
  birthChartId: z.string().optional(),
  createConversation: z.boolean().optional().default(true),
});

export function createCompanionProvisionRoutes(container: Container): Router {
  const router = Router();
  const { authMiddleware } = createAuthMiddleware(container);

  router.post('/provision', authMiddleware, async (req, res, next) => {
    try {
      const body = provisionSchema.parse(req.body);
      const userId = req.user!.sub;

      const {
        companionPersonaRepository,
        birthChartRepository,
        conversationRepository,
        agentProvisioner,
      } = container.cradle;

      // 1. Fetch companion persona
      const persona = await companionPersonaRepository.getById(body.companionPersonaId);
      if (!persona) {
        return res.status(404).json({ error: 'Companion persona not found' });
      }
      if (persona.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to provision this persona' });
      }

      // 2. Fetch birth chart
      const chartId = body.birthChartId || persona.birthChartId;
      let birthChart = chartId ? await birthChartRepository.getById(chartId) : null;
      if (!birthChart) {
        birthChart = await birthChartRepository.getActiveByUserId(userId);
      }

      // 3. Create conversation first (so conversationId is available for agent record)
      let conversationId: string | undefined;
      if (body.createConversation) {
        conversationId = `conv_${randomUUID()}`;
        await conversationRepository.create({
          id: conversationId,
          userId,
          title: `Chat with ${persona.name}`,
          companionPersonaId: persona.id,
        });
      }

      // 4. Provision agent — pass domain objects directly, no manual mapping
      const result = await agentProvisioner.provisionCompanionAgent({
        userId,
        companionPersonaId: persona.id,
        companion: persona,
        chart: birthChart?.chartData ?? null,
        userName: birthChart?.displayName,
        conversationId,
      });

      // 5. Link agent to conversation (best-effort)
      if (conversationId && result.lettaAgentId) {
        try {
          await conversationRepository.update(conversationId, {
            lettaAgentId: result.lettaAgentId,
          });
        } catch (err) {
          console.warn('[Companion] Failed to link agent to conversation:', err);
        }
      }

      return res.status(201).json({
        lettaAgentId: result.lettaAgentId,
        agentName: result.agentName,
        blockIds: result.blockIds,
        conversationId,
        companionPersonaId: persona.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  });

  return router;
}
