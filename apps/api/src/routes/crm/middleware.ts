/**
 * CRM Routes Middleware
 *
 * Authentication and authorization middleware for CRM routes
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Check if request is authenticated
 * In production, this should validate JWT tokens or session cookies
 */
export function isAuthenticated(req: Request): boolean {
  // TODO: Implement proper authentication check
  // This is a placeholder that checks for admin session
  return (req as any).session?.isAdmin === true || (req as any).user?.isAdmin === true;
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
 * For HTML routes (renders login page if not authenticated)
 */
export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isAuthenticated(req)) {
    // For HTML routes, render a simple login message
    // In production, redirect to login page
    res.status(401).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unauthorized - Anplexa CRM</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #121212;
            color: #E0E1DD;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: #1a1a1a;
            border-radius: 12px;
            border: 1px solid #333;
          }
          h1 { color: #7B2CBF; margin: 0 0 16px 0; }
          p { color: #9CA3AF; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Access Denied</h1>
          <p>You must be authenticated to access this page</p>
        </div>
      </body>
      </html>
    `);
    return;
  }
  next();
}
