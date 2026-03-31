/**
 * Companion Routes Barrel
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createAuthMiddleware } from '../../middleware/auth.js';
import { createCompanionActiveRoutes } from './active.js';
import { createCompanionGenerateRoutes } from './generate.js';
import { createCompanionProvisionRoutes } from './provision.js';
import { createCompanionSaveRoutes } from './save.js';

export function createCompanionRoutes(container: Container): Router {
  const router = Router();
  const { optionalAuthMiddleware } = createAuthMiddleware(container);

  router.use(optionalAuthMiddleware);
  router.use('/', createCompanionActiveRoutes(container));
  router.use('/', createCompanionGenerateRoutes(container));
  router.use('/', createCompanionProvisionRoutes(container));
  router.use('/', createCompanionSaveRoutes(container));
  return router;
}
