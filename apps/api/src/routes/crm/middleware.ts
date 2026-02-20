/**
 * CRM Routes Middleware
 *
 * Uses the admin auth system for CRM access control.
 * Simple implementation for dev/testing phase.
 */

import type { Request, Response, NextFunction } from 'express';
import {
  isAuthenticated as isAdminAuthenticated,
} from '../../middleware/adminAuth.js';

/**
 * Check if request is authenticated via admin session
 */
export function isAuthenticated(req: Request): boolean {
  return isAdminAuthenticated(req);
}

/**
 * Require authentication middleware
 * Responds with 401 if not authenticated
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

/**
 * Require admin authentication middleware
 * For HTML routes (redirects to admin login if not authenticated)
 */
export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isAuthenticated(req)) {
    res.redirect('/admin');
    return;
  }
  next();
}
