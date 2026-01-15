/**
 * Chat API Routes
 *
 * Endpoints for sending messages to companions with memory and transit awareness.
 */

import { Router } from 'express';
import { SendCosmicMessageUseCase } from '@anplexa/cosmic-companion/use-cases';
import { TransitService } from '@anplexa/cosmic-companion/domain/services';
import {
  DrizzleCompanionRepository,
  DrizzleBirthChartRepository,
  DrizzleMemoryRepository
} from '@anplexa/cosmic-adapters/persistence';
import { CosmicAIService, MockLLMProvider, MockEphemerisService } from '@anplexa/cosmic-adapters/external';
import type { Request, Response } from 'express';

const router = Router();

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * POST /api/cosmic/chat/message
 * Send a message to a companion
 */
router.post('/chat/message', requireAuth, async (req: Request, res: Response) => {
  try {
    const { companionId, message, conversationHistory = [] } = req.body;

    if (!companionId || !message) {
      return res.status(400).json({
        error: 'Missing required fields: companionId, message'
      });
    }

    const db = (req as any).db;

    // Initialize repositories and services
    const companionRepo = new DrizzleCompanionRepository(db);
    const birthChartRepo = new DrizzleBirthChartRepository(db);
    const memoryRepo = new DrizzleMemoryRepository(db);
    const ephemerisService = new MockEphemerisService();
    const transitService = new TransitService();

    // Initialize AI service (TODO: Replace MockLLMProvider with real provider)
    const aiService = new CosmicAIService(new MockLLMProvider());

    // Execute use case
    const useCase = new SendCosmicMessageUseCase(
      companionRepo,
      birthChartRepo,
      memoryRepo,
      aiService,
      ephemerisService,
      transitService
    );

    const result = await useCase.execute({
      userId: req.user!.id,
      companionId,
      message,
      conversationHistory
    });

    res.json({
      success: true,
      response: result.response,
      transitContext: result.transitContext
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/cosmic/chat/memories/:companionId
 * Get companion memories for debugging/viewing
 */
router.get('/chat/memories/:companionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = (req as any).db;
    const memoryRepo = new DrizzleMemoryRepository(db);
    const companionRepo = new DrizzleCompanionRepository(db);

    // Verify companion ownership
    const companion = await companionRepo.findById(req.params.companionId);
    if (!companion || companion.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const memories = await memoryRepo.findByCompanionId(req.params.companionId);

    res.json({
      success: true,
      memories: memories.map(m => m.toJSON())
    });
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({
      error: 'Failed to fetch memories',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
