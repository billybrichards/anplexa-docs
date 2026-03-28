/**
 * Companion Routes Barrel
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createCompanionGenerateRoutes } from './generate.js';
import { createCompanionProvisionRoutes } from './provision.js';

export function createCompanionRoutes(container: Container): Router {
  const router = Router();
  router.use('/', createCompanionGenerateRoutes(container));
  router.use('/', createCompanionProvisionRoutes(container));
  return router;
}
