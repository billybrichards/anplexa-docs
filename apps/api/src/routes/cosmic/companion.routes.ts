/**
 * Companion API Routes
 *
 * Endpoints for creating, retrieving, and managing AI companions.
 */

import { Router } from 'express';
import { CreateCompanionUseCase } from '@anplexa/cosmic-companion/use-cases';
import { CompatibilityService } from '@anplexa/cosmic-companion/domain/services';
import { DrizzleBirthChartRepository, DrizzleCompanionRepository } from '@anplexa/cosmic-adapters/persistence';
import type { Request, Response } from 'express';

const router = Router();

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * POST /api/cosmic/companion
 * Create a new AI companion matched to user's birth chart
 */
router.post('/companion', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, appearance, personalityAdjustments, userTier = 'free' } = req.body;

    if (!name || !appearance) {
      return res.status(400).json({
        error: 'Missing required fields: name, appearance'
      });
    }

    const db = (req as any).db;
    const birthChartRepo = new DrizzleBirthChartRepository(db);
    const companionRepo = new DrizzleCompanionRepository(db);
    const compatibilityService = new CompatibilityService();

    const useCase = new CreateCompanionUseCase(
      birthChartRepo,
      companionRepo,
      compatibilityService
    );

    const result = await useCase.execute({
      userId: req.user!.id,
      name,
      userTier,
      appearance,
      personalityAdjustments
    });

    res.json({
      success: true,
      companion: result.companion.toJSON(),
      explanation: result.explanation
    });
  } catch (error) {
    console.error('Error creating companion:', error);
    res.status(500).json({
      error: 'Failed to create companion',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/cosmic/companion/:id
 * Get a specific companion by ID
 */
router.get('/companion/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = (req as any).db;
    const companionRepo = new DrizzleCompanionRepository(db);

    const companion = await companionRepo.findById(req.params.id);

    if (!companion) {
      return res.status(404).json({ error: 'Companion not found' });
    }

    // Verify ownership
    if (companion.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({
      success: true,
      companion: companion.toJSON()
    });
  } catch (error) {
    console.error('Error fetching companion:', error);
    res.status(500).json({
      error: 'Failed to fetch companion',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/cosmic/companion
 * List all companions for the current user
 */
router.get('/companion', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = (req as any).db;
    const companionRepo = new DrizzleCompanionRepository(db);

    const companions = await companionRepo.findByUserId(req.user!.id);

    res.json({
      success: true,
      companions: companions.map(c => c.toJSON())
    });
  } catch (error) {
    console.error('Error listing companions:', error);
    res.status(500).json({
      error: 'Failed to list companions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/cosmic/companion/:id
 * Update companion appearance or personality
 */
router.patch('/companion/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, appearance, personalitySliders } = req.body;
    const db = (req as any).db;
    const companionRepo = new DrizzleCompanionRepository(db);

    const companion = await companionRepo.findById(req.params.id);

    if (!companion) {
      return res.status(404).json({ error: 'Companion not found' });
    }

    if (companion.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Update fields
    if (name) companion.rename(name);
    if (appearance) companion.updateAppearance(appearance);
    if (personalitySliders) companion.updatePersonality(personalitySliders);

    await companionRepo.save(companion);

    res.json({
      success: true,
      companion: companion.toJSON()
    });
  } catch (error) {
    console.error('Error updating companion:', error);
    res.status(500).json({
      error: 'Failed to update companion',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/cosmic/companion/:id
 * Delete a companion
 */
router.delete('/companion/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = (req as any).db;
    const companionRepo = new DrizzleCompanionRepository(db);

    const companion = await companionRepo.findById(req.params.id);

    if (!companion) {
      return res.status(404).json({ error: 'Companion not found' });
    }

    if (companion.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await companionRepo.delete(req.params.id);

    res.json({
      success: true,
      message: 'Companion deleted'
    });
  } catch (error) {
    console.error('Error deleting companion:', error);
    res.status(500).json({
      error: 'Failed to delete companion',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
