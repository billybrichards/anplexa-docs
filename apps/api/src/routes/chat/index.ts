/**
 * Chat Routes Barrel
 *
 * All chat endpoints require JWT authentication.
 * The /send endpoint is additionally rate-limited for free-tier users.
 * Internal endpoints (call-summary) use internal API key auth instead of JWT.
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createAuthMiddleware } from '../../middleware/auth.js';
import { rateLimitMiddleware } from '@anplexa/services';
import { createChatSendRoutes } from './send.js';
import { createChatConversationRoutes } from './conversations.js';
import { createChatInternalRoutes } from './internal.js';

export function createChatRoutes(container: Container): Router {
  const router = Router();
  const { authMiddleware } = createAuthMiddleware(container);

  // Internal routes (call-summary, etc.) use internal API key — mount BEFORE JWT middleware
  router.use('/', createChatInternalRoutes(container));

  // All remaining chat routes require JWT authentication
  router.use(authMiddleware);

  // Rate limit the send endpoint (5 msgs/day for free users, unlimited for subscribers)
  const { rateLimitService } = container.cradle;
  router.post('/send', rateLimitMiddleware(rateLimitService));

  // Mount sub-routers
  router.use('/', createChatSendRoutes(container));
  router.use('/', createChatConversationRoutes(container));
  return router;
}
