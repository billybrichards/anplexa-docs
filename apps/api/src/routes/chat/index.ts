/**
 * Chat Routes Barrel
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createAuthMiddleware } from '../../middleware/auth.js';
import { createChatSendRoutes } from './send.js';
import { createChatConversationRoutes } from './conversations.js';

export function createChatRoutes(container: Container): Router {
  const router = Router();
  const { optionalAuthMiddleware } = createAuthMiddleware(container);

  // Apply optional auth — allows guest access but attaches user when token is present
  router.use(optionalAuthMiddleware);
  router.use('/', createChatSendRoutes(container));
  router.use('/', createChatConversationRoutes(container));
  return router;
}
