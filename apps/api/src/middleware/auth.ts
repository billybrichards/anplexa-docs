/**
 * Authentication Middleware
 *
 * JWT-based authentication middleware using @anplexa/services.
 * No direct database access - uses JWTService from the DI container.
 */

import type { Request, Response, NextFunction } from 'express';
import type { Container } from '../container.js';

/**
 * Token payload interface matching JWT structure
 */
export interface TokenPayload {
  sub: string; // User ID
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Extend Express Request type to include user
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Create authentication middleware factory
 */
export function createAuthMiddleware(container: Container) {
  const { jwtService } = container.cradle;

  /**
   * Authentication middleware
   * Verifies JWT token from Authorization header
   */
  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = payload;
    next();
  };

  /**
   * Admin middleware
   * Requires user to be an admin
   */
  const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  };

  /**
   * Optional auth middleware
   * Attaches user to request if token is valid, but doesn't require it
   */
  const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = jwtService.verifyAccessToken(token);
      if (payload) {
        req.user = payload;
      }
    }

    next();
  };

  return {
    authMiddleware,
    adminMiddleware,
    optionalAuthMiddleware,
  };
}
