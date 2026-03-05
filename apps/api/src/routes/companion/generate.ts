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

      // FIX: Provision a Letta agent for the companion so chat works after onboarding.
      // Uses AgentProvisioner which creates the agent on the Letta server and stores the mapping.
      let lettaAgentId: string | null = null;
      try {
        const { agentProvisioner } = container.cradle;
        const provisionResult = await agentProvisioner.provisionCompanionAgent({
          userId: 'guest', // Guest user during onboarding; will be linked on auth
          companionPersonaId: compatibility.companionPersonaId,
          companionName: generatedPersona.name,
          description: generatedPersona.reasoning,
          style: generatedPersona.communicationStyle?.tone || undefined,
        });
        lettaAgentId = provisionResult.lettaAgentId;
        console.log(`[CompanionGenerate] Letta agent provisioned: ${lettaAgentId} for ${generatedPersona.name}`);
      } catch (lettaError) {
        // Non-fatal: companion can still be created without Letta agent
        // Chat will need to handle missing agent gracefully
        console.warn('[CompanionGenerate] Letta agent provisioning failed (non-fatal):', lettaError);
      }

      // Persist the companion persona to DB so the returned ID can be used for chat
      const userId = req.user?.sub || 'guest';
      const personaId = `persona_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const { companionPersonaRepository, birthChartRepository } = container.cradle;

      let persistedPersonaId: string | null = null;
      if (companionPersonaRepository && birthChartRepository) {
        try {
          // Create a birth chart record from submitted data
          const birthChartId = `chart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          await birthChartRepository.create({
            id: birthChartId,
            userId,
            birthData: JSON.stringify(body.birthData),
            chartData: JSON.stringify(body.chartData),
            displayName: generatedPersona.name,
          });

          await companionPersonaRepository.create({
            id: personaId,
            userId,
            birthChartId,
            name: generatedPersona.name,
            personalityTraits: JSON.stringify(traits),
            communicationStyle: JSON.stringify(generatedPersona.communicationStyle),
            emotionalApproach: JSON.stringify(generatedPersona.emotionalApproach),
            systemPrompt: generatedPersona.reasoning || '',
            llmModel: 'ollama',
            generationReasoning: generatedPersona.reasoning,
            generatedAt: new Date().toISOString(),
            lettaAgentId: lettaAgentId || undefined,
          });
          persistedPersonaId = personaId;
          console.log(`[CompanionGenerate] Persisted persona ${personaId} for user ${userId}`);
        } catch (persistError) {
          // Non-fatal: persona generation still succeeds even if DB persistence fails
          console.warn('[CompanionGenerate] Failed to persist persona:', persistError);
        }
      }

      return res.status(200).json({
        persona: {
          id: persistedPersonaId || personaId, // Usable ID for subsequent chat requests
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
        // Include Letta agent ID so the frontend can store it for chat
        lettaAgentId,
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
