/**
 * Chat Routes Barrel Export
 *
 * Combines all chat routes into a single router.
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createStreamingRoutes } from './send-message.js';
import { createNonStreamingRoutes } from './send-message-non-streaming.js';
import { createConfigRoutes } from './config.js';
import { createModelsRoutes } from './models.js';
import { createFeedbackRoutes } from './feedback.js';

/**
 * Create and configure the chat router
 */
export function createChatRoutes(container: Container): Router {
  const router = Router();

  // Mount sub-routers
  router.use(createStreamingRoutes(container));
  router.use(createNonStreamingRoutes(container));
  router.use(createConfigRoutes(container));
  router.use(createModelsRoutes(container));
  router.use(createFeedbackRoutes(container));

  return router;
}

// Re-export individual route creators for flexibility
export { createStreamingRoutes } from './send-message.js';
export { createNonStreamingRoutes } from './send-message-non-streaming.js';
export { createConfigRoutes } from './config.js';
export { createModelsRoutes } from './models.js';
export { createFeedbackRoutes } from './feedback.js';
