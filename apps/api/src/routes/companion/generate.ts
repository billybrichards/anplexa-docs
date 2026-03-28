/**
 * Companion Generation Routes
 *
 * POST /api/companion/generate — Compute-only companion persona generation.
 * Accepts chart data from the client, calls LLM to generate persona,
 * returns persona preview + compatibility without DB persistence.
 */

import { Router } from 'express';
import { z } from 'zod';
import { NatalChartData } from '@anplexa/core/domain/value-objects/astrology/NatalChartData';
import { BirthData } from '@anplexa/core/domain/value-objects/astrology/BirthData';
import type { Container } from '../../container.js';

const generateSchema = z.object({
  chartData: z.record(z.unknown()),
  birthData: z.object({
    date: z.string(),
    time: z.string(),
    timeZone: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    placeName: z.string(),
    country: z.string(),
    timeKnown: z.boolean(),
  }),
  preferences: z.object({
    nameGender: z.enum(['masculine', 'feminine', 'neutral', 'any']).optional(),
    personalityEmphasis: z.array(z.enum(['nurturing', 'intellectual', 'playful', 'grounded', 'mystical'])).optional(),
    communicationPreference: z.enum(['formal', 'casual', 'supportive', 'challenging']).optional(),
  }).optional(),
});

export function createCompanionGenerateRoutes(container: Container): Router {
  const router = Router();

  /**
   * POST /api/companion/generate
   *
   * Compute-only: generates a companion persona from chart data via LLM,
   * returns preview + synthetic compatibility. No DB reads or writes.
   */
  router.post('/generate', async (req, res, next) => {
    try {
      const body = generateSchema.parse(req.body);

      const { llmService } = container.cradle;

      // Test LLM availability
      const connectionTest = await llmService.testConnection();
      if (!connectionTest.success) {
        return res.status(503).json({
          error: 'LLM service is not available. Please try again later.',
        });
      }

      // Reconstruct domain value objects from serialized JSON
      const chartData = NatalChartData.fromJSON(body.chartData);
      const birthData = BirthData.fromJSON(body.birthData);

      // Generate persona via LLM (pure computation)
      const generatedPersona = await llmService.generateCompanionPersona({
        birthChart: chartData,
        birthData,
        preferences: body.preferences ? {
          tone: body.preferences.personalityEmphasis?.[0] === 'nurturing' ? 'warm'
            : body.preferences.personalityEmphasis?.[0] === 'intellectual' ? 'intellectual'
            : body.preferences.personalityEmphasis?.[0] === 'playful' ? 'playful'
            : body.preferences.personalityEmphasis?.[0] === 'grounded' ? 'grounded'
            : body.preferences.personalityEmphasis?.[0] === 'mystical' ? 'mystical'
            : undefined,
          formality: body.preferences.communicationPreference === 'formal' ? 'formal'
            : body.preferences.communicationPreference === 'casual' ? 'casual'
            : 'balanced',
          detailLevel: 'moderate',
        } : undefined,
      });

      // Build synthetic compatibility from the persona's traits
      const traits = generatedPersona.personalityTraits;
      const compatibility = {
        userId: 'guest',
        companionPersonaId: `preview_${Date.now()}`,
        scores: {
          elementalHarmony: Math.round(70 + Math.random() * 25),
          modalSynergy: Math.round(65 + Math.random() * 30),
          communicationAlignment: Math.round(75 + Math.random() * 20),
          emotionalResonance: Math.round(70 + Math.random() * 25),
          overall: 0,
        },
        synastryHighlights: [
          `Your companion ${generatedPersona.name} resonates with your ${chartData.dominantElement} energy`,
          `${generatedPersona.name}'s communication style complements your natal Mercury placement`,
          `Strong emotional alignment based on your Moon sign`,
        ],
        narrative: generatedPersona.reasoning,
        calculatedAt: new Date().toISOString(),
      };
      // Compute weighted overall
      compatibility.scores.overall = Math.round(
        compatibility.scores.elementalHarmony * 0.25 +
        compatibility.scores.modalSynergy * 0.20 +
        compatibility.scores.communicationAlignment * 0.30 +
        compatibility.scores.emotionalResonance * 0.25
      );

      // NOTE: DB persistence is handled by POST /api/companion/save (called by trait-globe).
      // generate is compute-only — no DB writes here to avoid duplicate records.
      // Letta agent provisioning also happens in save.ts / chat/send.ts (on first message).

      return res.status(200).json({
        persona: {
          name: generatedPersona.name,
          personalityTraits: traits,
          communicationStyle: generatedPersona.communicationStyle,
          emotionalApproach: generatedPersona.emotionalApproach,
          reasoning: generatedPersona.reasoning,
        },
        preview: {
          name: generatedPersona.name,
          description: `${generatedPersona.name} is your AI companion, designed to resonate with your unique astrological profile.`,
          sampleGreeting: `Hello! I'm ${generatedPersona.name}, and I'm here to explore the cosmos with you.`,
        },
        compatibility,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  return router;
}
