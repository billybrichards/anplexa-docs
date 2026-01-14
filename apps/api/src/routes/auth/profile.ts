/**
 * User Profile Routes
 *
 * Handles user profile and session management endpoints.
 * Uses @anplexa/core repositories directly for profile operations.
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createAuthMiddleware } from '../../middleware/auth.js';

/**
 * Helper for POST-only endpoints - return helpful message for GET requests
 */
const postOnlyHandler = (endpoint: string) => (_req: any, res: any) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    message: `${endpoint} requires a POST request`,
    method: 'POST',
    contentType: 'application/json',
  });
};

/**
 * Create user profile routes
 */
export function createProfileRoutes(container: Container): Router {
  const router = Router();
  const { userRepository, sessionRepository } = container.cradle;
  const { authMiddleware } = createAuthMiddleware(container);

  // GET handler for helpful error message
  router.get('/logout', postOnlyHandler('/api/auth/logout'));

  // GET /api/auth/me - Get current user profile
  router.get('/me', authMiddleware, async (req, res, next) => {
    try {
      const user = await userRepository.getById(req.user!.sub);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          isAdmin: user.isAdmin,
          credits: user.credits,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error('Get user error:', error);
      next(error);
    }
  });

  // POST /api/auth/logout - Logout user and invalidate session
  router.post('/logout', authMiddleware, async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Delete specific session by refresh token
        const session = await sessionRepository.getByRefreshToken(refreshToken);
        if (session) {
          await sessionRepository.delete(session.id);
        }
      } else {
        // Delete all sessions for user - get all sessions and delete them
        const sessions = await sessionRepository.getByUserId(req.user!.sub);
        await Promise.all(sessions.map(s => sessionRepository.delete(s.id)));
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      next(error);
    }
  });

  return router;
}
