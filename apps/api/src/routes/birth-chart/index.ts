/**
 * Birth Chart Routes Barrel Export
 *
 * Combines all birth chart routes into a single router.
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createCalculateBirthChartRoutes } from './calculate.js';

/**
 * Create and configure the birth chart router
 */
export function createBirthChartRoutes(container: Container): Router {
  const router = Router();

  // Mount sub-routers
  router.use(createCalculateBirthChartRoutes(container));

  return router;
}

// Re-export individual route creators for flexibility
export { createCalculateBirthChartRoutes } from './calculate.js';
