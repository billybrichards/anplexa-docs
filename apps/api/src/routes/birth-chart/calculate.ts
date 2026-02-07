/**
 * Birth Chart Calculation Routes
 *
 * Handles birth chart calculation using @anplexa/core use cases.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';

// Validation schema
const calculateBirthChartSchema = z.object({
  userId: z.string(),
  birthDate: z.string(), // ISO date string
  birthTime: z.string().nullable(), // HH:MM or null
  timeZone: z.string(), // IANA timezone
  latitude: z.number(),
  longitude: z.number(),
  placeName: z.string(),
  country: z.string(),
  displayName: z.string().optional().nullable(),
  setAsActive: z.boolean().optional(),
  houseSystem: z.enum(['placidus', 'whole_sign', 'koch', 'equal']).optional(),
});

/**
 * Create birth chart calculation routes
 */
export function createCalculateBirthChartRoutes(container: Container): Router {
  const router = Router();
  const { useCases } = container.cradle;

  // POST /api/birth-chart/calculate
  router.post('/calculate', async (req, res, next) => {
    try {
      const body = calculateBirthChartSchema.parse(req.body);

      if (!useCases.calculateBirthChart) {
        return res.status(501).json({ error: 'Birth chart calculation is not available' });
      }

      // Execute calculation use case
      const result = await useCases.calculateBirthChart.execute({
        userId: body.userId,
        birthDate: body.birthDate,
        birthTime: body.birthTime,
        timeZone: body.timeZone,
        latitude: body.latitude,
        longitude: body.longitude,
        placeName: body.placeName,
        country: body.country,
        displayName: body.displayName,
        setAsActive: body.setAsActive,
        houseSystem: body.houseSystem,
      });

      res.status(201).json({
        message: 'Birth chart calculated successfully',
        birthChart: {
          id: result.birthChart.id,
          displayName: result.birthChart.displayName,
          isActive: result.birthChart.isActive,
        },
        sunSign: result.sunSign,
        moonSign: result.moonSign,
        risingSign: result.risingSign,
        interpretation: result.interpretation,
        companionContext: result.companionContext,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      if (error instanceof Error) {
        // Handle domain errors (e.g., duplicate chart, invalid birth data)
        return res.status(400).json({
          error: error.message,
        });
      }
      next(error);
    }
  });

  return router;
}
