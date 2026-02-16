/**
 * Companion Generation Routes
 *
 * POST /api/companion/generate — Generate a companion persona from birth chart data
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';

const generateSchema = z.object({
  userId: z.string().optional().default('guest'),
  birthChartId: z.string().optional(),
  regenerate: z.boolean().optional().default(false),
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
   * Generates a companion persona from the user's birth chart using the LLM service.
   */
  router.post('/generate', async (req, res, next) => {
    try {
      const body = generateSchema.parse(req.body);

      const { useCases } = container.cradle;

      if (!useCases.generateCompanionPersona) {
        return res.status(501).json({
          error: 'Companion generation is not available',
          message: 'LLM service not configured',
        });
      }

      const result = await useCases.generateCompanionPersona.execute({
        userId: body.userId,
        birthChartId: body.birthChartId,
        regenerate: body.regenerate,
        preferences: body.preferences,
      });

      // Trigger profile image generation (fire-and-forget)
      let profileImageGenerationId: string | undefined;
      try {
        const { profileGeneratorAgent } = container.cradle;
        if (profileGeneratorAgent && result.persona) {
          const profileResult = await profileGeneratorAgent.generateProfileImage({
            companionId: result.persona.id,
            companionName: result.persona.name || 'companion',
            appearanceDescription: '', // Will use name fallback
            userId: body.userId,
          });
          if (profileResult.status === 'generating') {
            profileImageGenerationId = profileResult.generationId;
          }
        }
      } catch {
        // Non-fatal — persona still created successfully
      }

      return res.status(201).json({
        ...result,
        profileImageGenerationId,
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
