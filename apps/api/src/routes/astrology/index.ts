/**
 * Astrology Routes Barrel
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createAnalyzeTraitsRoutes } from './analyze-traits.js';

export function createAstrologyRoutes(container: Container): Router {
  const router = Router();

  router.use('/', createAnalyzeTraitsRoutes(container));

  return router;
}
