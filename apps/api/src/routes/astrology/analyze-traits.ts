/**
 * Trait Analysis Routes
 *
 * POST /api/astrology/analyze-traits — Extract personality traits from chart data.
 * Compute-only: accepts serialized chart data from the client, no DB access.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';
import { NatalChartData } from '@anplexa/core/domain/value-objects/astrology/NatalChartData';

const analyzeTraitsSchema = z.object({
  chartData: z.record(z.unknown()),
  userId: z.string().optional().default('guest'),
  birthChartId: z.string().optional().default('unknown'),
});

export function createAnalyzeTraitsRoutes(container: Container): Router {
  const router = Router();
  const { useCases } = container.cradle;

  /**
   * POST /api/astrology/analyze-traits
   *
   * Takes serialized natal chart data, reconstructs it, then extracts
   * personality traits via TraitExtractionService + AI enrichment.
   */
  router.post('/analyze-traits', async (req, res, next) => {
    try {
      const body = analyzeTraitsSchema.parse(req.body);

      if (!useCases.analyzeChartPersonality) {
        return res.status(501).json({ error: 'Trait analysis is not available' });
      }

      // Reconstruct the NatalChartData value object from serialized JSON
      const chartData = NatalChartData.fromJSON(body.chartData);

      const result = await useCases.analyzeChartPersonality.execute({
        chartData,
        userId: body.userId,
        birthChartId: body.birthChartId,
      });

      return res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  });

  return router;
}
