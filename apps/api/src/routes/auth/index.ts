/**
 * Auth Routes Barrel Export
 *
 * Combines all authentication routes into a single router.
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createRegisterRoutes } from './register.js';
import { createLoginRoutes } from './login.js';
import { createRefreshRoutes } from './refresh.js';
import { createPasswordRoutes } from './password.js';
import { createProfileRoutes } from './profile.js';
import { createVerifyEmailRoutes } from './verify-email.js';

/**
 * Create and configure the auth router
 */
export function createAuthRoutes(container: Container): Router {
  const router = Router();

  // Mount sub-routers
  router.use(createRegisterRoutes(container));
  router.use(createLoginRoutes(container));
  router.use(createRefreshRoutes(container));
  router.use(createPasswordRoutes(container));
  router.use(createProfileRoutes(container));
  router.use(createVerifyEmailRoutes(container));

  return router;
}

// Re-export individual route creators for flexibility
export { createRegisterRoutes } from './register.js';
export { createLoginRoutes } from './login.js';
export { createRefreshRoutes } from './refresh.js';
export { createPasswordRoutes } from './password.js';
export { createProfileRoutes } from './profile.js';
export { createVerifyEmailRoutes } from './verify-email.js';
