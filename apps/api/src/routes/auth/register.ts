/**
 * Registration Routes
 *
 * Handles user registration endpoints using @anplexa/core use cases.
 * No direct database access - all logic delegated to use cases.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Container } from '../../container.js';
import { ValidationError } from '@anplexa/core';

// Validation schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().optional(),
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
 * Create registration routes
 */
export function createRegisterRoutes(container: Container): Router {
  const router = Router();
  const { useCases } = container.cradle;

  // GET handler for helpful error message
  router.get('/register', postOnlyHandler('/api/auth/register'));

  // POST /api/auth/register
  router.post('/register', async (req, res, next) => {
    try {
      const body = registerSchema.parse(req.body);

      // Execute registration use case
      const result = await useCases.registerUser.execute({
        email: body.email,
        password: body.password,
        displayName: body.displayName,
      });

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: result.userId,
          email: result.email,
        },
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
      next(error);
    }
  });

  return router;
}
