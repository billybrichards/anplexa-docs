/**
 * Birth Chart Calculation Routes
 *
 * Compute-only endpoint — calculates natal chart without DB persistence.
 * Chart data lives in frontend session storage until the user authenticates,
 * at which point it can be persisted via a separate endpoint.
 */

import { Router } from 'express';
import { z } from 'zod';
import { BirthData } from '@anplexa/core/domain/value-objects/astrology/BirthData';
import type { Container } from '../../container.js';

// Validation schema — userId removed (not needed for compute-only)
const calculateBirthChartSchema = z.object({
  userId: z.string().optional(), // ignored — kept for backwards compat with frontend
  birthDate: z.string(), // ISO date string
  birthTime: z.string().nullable(), // HH:MM or null
  timeZone: z.string(), // IANA timezone
  latitude: z.number(),
  longitude: z.number(),
  placeName: z.string(),
  country: z.string(),
  displayName: z.string().optional().nullable(),
  houseSystem: z.enum(['placidus', 'whole_sign', 'koch', 'equal']).optional(),
});

/**
 * Create birth chart calculation routes
 */
export function createCalculateBirthChartRoutes(container: Container): Router {
  const router = Router();
  const { astrologyService } = container.cradle;

  // POST /api/birth-chart/calculate
  router.post('/calculate', async (req, res, next) => {
    try {
      const body = calculateBirthChartSchema.parse(req.body);

      // Build the domain value object
      const birthData = BirthData.create({
        date: new Date(body.birthDate),
        time: body.birthTime || '12:00',
        timeZone: body.timeZone,
        latitude: body.latitude,
        longitude: body.longitude,
        placeName: body.placeName,
        country: body.country,
        timeKnown: body.birthTime !== null,
      });

      // Pure computation — no DB writes
      const chartData = await astrologyService.calculateNatalChart(birthData);
      const [interpretation, companionContext] = await Promise.all([
        astrologyService.generateInterpretation(chartData),
        astrologyService.generateCompanionContext(chartData),
      ]);

      const bigThree = chartData.getBigThree();

      res.status(200).json({
        message: 'Birth chart calculated successfully',
        sunSign: bigThree.sun,
        moonSign: bigThree.moon,
        risingSign: bigThree.rising,
        chartData: chartData.toJSON(),
        interpretation,
        companionContext,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      }
      next(error);
    }
  });

  return router;
}
