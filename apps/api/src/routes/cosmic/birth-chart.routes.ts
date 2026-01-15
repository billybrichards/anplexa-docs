/**
 * Birth Chart API Routes
 *
 * Endpoints for creating and retrieving user birth charts.
 */

import { Router } from 'express';
import { CreateBirthChartUseCase } from '@anplexa/cosmic-companion/use-cases';
import { DrizzleBirthChartRepository } from '@anplexa/cosmic-adapters/persistence';
import { MockEphemerisService } from '@anplexa/cosmic-adapters/external';
import type { Request, Response } from 'express';

const router = Router();

// Middleware to ensure user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * POST /api/cosmic/birth-chart
 * Create or update user's birth chart
 */
router.post('/birth-chart', requireAuth, async (req: Request, res: Response) => {
  try {
    const { birthDate, birthTime, latitude, longitude, timezone, city, country } = req.body;

    // Validate required fields
    if (!birthDate || !birthTime || !latitude || !longitude || !timezone) {
      return res.status(400).json({
        error: 'Missing required fields: birthDate, birthTime, latitude, longitude, timezone'
      });
    }

    // Get database instance from request context
    const db = (req as any).db;

    // Initialize repositories and services
    const birthChartRepo = new DrizzleBirthChartRepository(db);
    const ephemerisService = new MockEphemerisService(); // TODO: Replace with real service

    // Execute use case
    const useCase = new CreateBirthChartUseCase(birthChartRepo, ephemerisService);
    const result = await useCase.execute({
      userId: req.user!.id,
      birthDate: new Date(birthDate),
      birthTime,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timezone,
      city,
      country
    });

    res.json({
      success: true,
      birthChart: result.birthChart.toJSON()
    });
  } catch (error) {
    console.error('Error creating birth chart:', error);
    res.status(500).json({
      error: 'Failed to create birth chart',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/cosmic/birth-chart
 * Get user's birth chart
 */
router.get('/birth-chart', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = (req as any).db;
    const birthChartRepo = new DrizzleBirthChartRepository(db);

    const birthChart = await birthChartRepo.findByUserId(req.user!.id);

    if (!birthChart) {
      return res.status(404).json({
        error: 'Birth chart not found',
        message: 'Please create your birth chart first'
      });
    }

    res.json({
      success: true,
      birthChart: birthChart.toJSON()
    });
  } catch (error) {
    console.error('Error fetching birth chart:', error);
    res.status(500).json({
      error: 'Failed to fetch birth chart',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
