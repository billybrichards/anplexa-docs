/**
 * Companion Save Route — Persist a generated companion persona to the database.
 *
 * POST /api/companion/save
 * Body: { name, personalityTraits, communicationStyle, emotionalApproach, reasoning, birthChartId? }
 *
 * Called after /api/companion/generate to persist the persona and get a real DB ID.
 * This ID is then used for chat (Letta agent mapping) and avoids the preview_<timestamp> problem.
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
  birthChartId: z.string().optional(),
  llmModel: z.string().optional(),
});

export function createCompanionSaveRoutes(container: Container): Router {
  const router = Router();

  /**
   * POST /api/companion/save
   *
   * Persists a generated companion persona to companionPersonas table.
   * Returns the real companionPersonaId for use in chat.
   *
   * If the user already has an active persona, deactivates it first
   * (one active companion per user).
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
      const existing = await companionPersonaRepository.getActiveByUserId(userId);
      if (existing) {
        console.log(`[CompanionSave] User ${userId} already has active persona: ${existing.id}, returning it`);
        return res.status(200).json({
          companionPersonaId: existing.id,
          name: existing.name,
          isExisting: true,
        });
      }

      const id = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Build minimal system prompt if not provided
      const systemPrompt = body.systemPrompt ||
        `You are ${body.name}, a compassionate AI companion. Be empathetic, understanding, and non-judgmental.`;

      // Insert into companionPersonas table using raw insert
      // (bypassing domain value objects since we're receiving raw JSON from the generate endpoint)
      const { db } = container.cradle;
      const { companionPersonas } = await import('@anplexa/database');

      const now = new Date().toISOString();
      const [result] = await db
        .insert(companionPersonas)
        .values({
          id,
          userId,
          birthChartId: body.birthChartId || `bc_placeholder_${userId}`,
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
        })
        .returning();

      console.log(`[CompanionSave] Created persona ${id} for user ${userId}: ${body.name}`);

      return res.status(201).json({
        companionPersonaId: result.id,
        name: result.name,
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
