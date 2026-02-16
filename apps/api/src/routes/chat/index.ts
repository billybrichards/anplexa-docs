/**
 * Chat Routes Barrel
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createChatSendRoutes } from './send.js';
import { createChatConversationRoutes } from './conversations.js';

export function createChatRoutes(container: Container): Router {
  const router = Router();
  router.use('/', createChatSendRoutes(container));
  router.use('/', createChatConversationRoutes(container));
  return router;
}
