/**
 * Media Routes
 *
 * POST /api/media/generate — Trigger media generation
 * GET /api/media/status/:id — Poll generation status
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';

const generateSchema = z.object({
  type: z.enum(['image', 'video']),
  enhancedPrompt: z.string().min(1),
  userId: z.string().optional().default('guest'),
  conversationId: z.string().optional(),
  companionId: z.string().optional(),
  faceImageFilename: z.string().optional(),
});

export function createMediaRoutes(container: Container): Router {
  const router = Router();

  router.post('/generate', async (req, res, next) => {
    try {
      const body = generateSchema.parse(req.body);

      const nativeMediaService = container.cradle.nativeMediaService;
      if (!nativeMediaService) {
        return res.status(501).json({ error: 'Media generation not configured' });
      }

      const result = await nativeMediaService.triggerGeneration(body);
      return res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  });

  router.get('/status/:id', async (req, res, next) => {
    try {
      const nativeMediaService = container.cradle.nativeMediaService;
      if (!nativeMediaService) {
        return res.status(501).json({ error: 'Media generation not configured' });
      }

      const result = await nativeMediaService.getStatus(req.params.id);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
