/**
 * Companion Routes Barrel
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createCompanionGenerateRoutes } from './generate.js';

export function createCompanionRoutes(container: Container): Router {
  const router = Router();
  router.use('/', createCompanionGenerateRoutes(container));
  return router;
}
