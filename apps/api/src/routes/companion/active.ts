/**
 * GET /api/companion/active — Return the authenticated user's active companion persona.
 * Used by the chat page for returning users who sign in (no sessionStorage).
 */

import { Router } from 'express';
import type { Container } from '../../container.js';

export function createCompanionActiveRoutes(container: Container): Router {
  const router = Router();

  router.get('/active', async (req, res, next) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { companionPersonaRepository } = container.cradle;
      const persona = await companionPersonaRepository.getActiveByUserId(userId);

      if (!persona) {
        return res.status(404).json({ error: 'No active companion found' });
      }

      return res.json({
        id: persona.id,
        name: persona.name,
        personality: persona.personalityTraits
          ? (typeof persona.personalityTraits === 'string'
              ? (() => { try { const p = JSON.parse(persona.personalityTraits); return p.traits || []; } catch { return []; } })()
              : [])
          : [],
        communicationStyle: persona.systemPrompt ? 'Personalized to your chart' : '',
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
