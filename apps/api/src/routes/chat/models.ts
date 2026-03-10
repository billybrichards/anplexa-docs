/**
 * Chat Models Route
 *
 * GET /models - Lists available AI models (admin only).
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createAuthMiddleware } from '../../middleware/auth.js';

export function createModelsRoutes(container: Container): Router {
  const router = Router();
  const { ollamaGateway } = container.cradle;
  const { authMiddleware, adminMiddleware } = createAuthMiddleware(container);

  router.get('/models', authMiddleware, adminMiddleware, async (_req, res, next) => {
    try {
      const models = await ollamaGateway.getModels();
      res.json({ models });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
