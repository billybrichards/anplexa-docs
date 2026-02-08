/**
 * Chat Config Route
 *
 * GET /config - Returns companion configuration for the user.
 * Supports both authenticated and guest users via optional auth.
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createAuthMiddleware } from '../../middleware/auth.js';

export function createConfigRoutes(container: Container): Router {
  const router = Router();
  const { companionPersonaRepository } = container.cradle;
  const { optionalAuthMiddleware } = createAuthMiddleware(container);

  router.get('/config', optionalAuthMiddleware, async (req, res, next) => {
    try {
      const userId = req.user?.sub;

      let companionName = 'Violet';
      let welcomeMessage = 'Hello! How can I assist you today?';

      if (userId) {
        const persona = await companionPersonaRepository.getActiveByUserId(userId);
        if (persona) {
          companionName = persona.name;
          welcomeMessage = persona.generateSampleGreeting();
        }
      }

      res.json({
        companion: {
          name: companionName,
          welcomeTitle: `${companionName} is here to help`,
          welcomeMessage,
        },
        defaults: {
          length: 'moderate',
          style: 'casual',
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
