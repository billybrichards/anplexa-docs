/**
 * Token Refresh Routes
 *
 * Handles token refresh endpoints using @anplexa/core use cases.
 * No direct database access - all logic delegated to use cases.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';
import { ValidationError, AuthenticationError } from '@anplexa/core';

// Validation schema
const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

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
 * Create token refresh routes
 */
export function createRefreshRoutes(container: Container): Router {
  const router = Router();
  const { useCases } = container.cradle;

  // GET handler for helpful error message
  router.get('/refresh', postOnlyHandler('/api/auth/refresh'));

  // POST /api/auth/refresh
  router.post('/refresh', async (req, res, next) => {
    try {
      const body = refreshTokenSchema.parse(req.body);

      // Execute token refresh use case
      const result = await useCases.refreshToken.execute({
        refreshToken: body.refreshToken,
      });

      res.json({
        message: 'Token refreshed',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      if (error instanceof ValidationError) {
        return res.status(400).json({
          error: error.message,
          field: error.field,
        });
      }
      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          error: error.message,
        });
      }
      next(error);
    }
  });

  return router;
}
