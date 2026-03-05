/**
 * Companion Save Route — Persist a generated companion persona to the database.
 *
 * POST /api/companion/save
 * Body: { name, personalityTraits, communicationStyle, emotionalApproach, reasoning,
 *         birthData?, chartData? }
 *
 * Called after /api/companion/generate to persist the persona and get a real DB ID.
 * This ID is then used for chat (Letta agent mapping) and avoids the preview_<timestamp> problem.
 *
 * Also provisions a Letta agent for the companion (non-fatal if Letta is down).
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';

const saveSchema = z.object({
  name: z.string().min(1),
  personalityTraits: z.record(z.unknown()),
  communicationStyle: z.record(z.unknown()),
  emotionalApproach: z.record(z.unknown()),
  systemPrompt: z.string().optional(),
  reasoning: z.string().optional(),
  llmModel: z.string().optional(),
  // Birth data for creating the birth chart record (avoids FK violation)
  birthData: z.record(z.unknown()).optional(),
  chartData: z.record(z.unknown()).optional(),
});

export function createCompanionSaveRoutes(container: Container): Router {
  const router = Router();

  /**
   * POST /api/companion/save
   *
   * Persists a generated companion persona to companionPersonas table.
   * Returns the real companionPersonaId for use in chat.
   *
   * If the user already has an active persona, returns it instead of creating duplicates.
   */
  router.post('/save', async (req, res, next) => {
    try {
      const body = saveSchema.parse(req.body);
      const userId = req.user?.sub || 'guest';

      const { companionPersonaRepository } = container.cradle;
      if (!companionPersonaRepository) {
        return res.status(501).json({ error: 'Companion persistence not available' });
      }

      // Check if user already has an active persona — reuse it instead of creating duplicates
      try {
        const existing = await companionPersonaRepository.getActiveByUserId(userId);
        if (existing) {
          console.log(`[CompanionSave] User ${userId} already has active persona: ${existing.id}, returning it`);
          return res.status(200).json({
            companionPersonaId: existing.id,
            name: existing.name,
            isExisting: true,
          });
        }
      } catch (lookupErr) {
        // getActiveByUserId may fail if table doesn't exist yet — continue to create
        console.warn('[CompanionSave] Active persona lookup failed (non-fatal):', lookupErr);
      }

      const id = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Build minimal system prompt if not provided
      const systemPrompt = body.systemPrompt ||
        `You are ${body.name}, a compassionate AI companion. Be empathetic, understanding, and non-judgmental.`;

      // ─── Create birth chart record first (required FK) ───
      let birthChartId: string | null = null;
      try {
        const { birthChartRepository } = container.cradle;
        if (birthChartRepository && (body.birthData || body.chartData)) {
          birthChartId = `bc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          await birthChartRepository.create({
            id: birthChartId,
            userId,
            birthData: JSON.stringify(body.birthData || {}),
            chartData: JSON.stringify(body.chartData || {}),
            displayName: body.name,
          });
          console.log(`[CompanionSave] Created birth chart ${birthChartId}`);
        }
      } catch (chartErr) {
        console.warn('[CompanionSave] Birth chart creation failed (non-fatal):', chartErr);
        birthChartId = null;
      }

      // ─── Create companion persona ───
      // Use repository if birthChartId is available (satisfies FK constraint),
      // otherwise try raw insert with nullable workaround
      const { db } = container.cradle;
      const { companionPersonas } = await import('@anplexa/database');

      const now = new Date().toISOString();
      const insertValues: Record<string, unknown> = {
        id,
        userId,
        name: body.name,
        personalityTraits: JSON.stringify(body.personalityTraits),
        communicationStyle: JSON.stringify(body.communicationStyle),
        emotionalApproach: JSON.stringify(body.emotionalApproach),
        systemPrompt,
        llmModel: body.llmModel || 'ollama/qwen3-30b-nsfw:latest',
        generationReasoning: body.reasoning || null,
        generatedAt: now,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      // Only include birthChartId if we have a valid one (avoids FK violation)
      if (birthChartId) {
        insertValues.birthChartId = birthChartId;
      }

      const [result] = await db
        .insert(companionPersonas)
        .values(insertValues)
        .returning();

      console.log(`[CompanionSave] Created persona ${id} for user ${userId}: ${body.name}`);

      // ─── Provision Letta agent (non-fatal) ───
      let lettaAgentId: string | null = null;
      try {
        const { agentProvisioner } = container.cradle;
        if (agentProvisioner) {
          const provisionResult = await agentProvisioner.provisionCompanionAgent({
            userId,
            companionPersonaId: id,
            companionName: body.name,
            description: body.reasoning || undefined,
            style: (body.communicationStyle as Record<string, unknown>)?.tone as string || undefined,
          });
          lettaAgentId = provisionResult.lettaAgentId;
          console.log(`[CompanionSave] Letta agent provisioned: ${lettaAgentId} for ${body.name}`);
        }
      } catch (lettaErr) {
        console.warn('[CompanionSave] Letta agent provisioning failed (non-fatal):', lettaErr);
      }

      return res.status(201).json({
        companionPersonaId: result.id,
        name: result.name,
        lettaAgentId,
        isExisting: false,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('[CompanionSave] Error:', error);
      next(error);
    }
  });

  return router;
}
