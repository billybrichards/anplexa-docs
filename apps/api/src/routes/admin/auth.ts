/**
 * Admin Authentication Routes
 *
 * Handles admin login, logout, and session management.
 */

import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import {
  ADMIN_PASSWORD,
  COOKIE_NAME,
  activeSessions,
  isRateLimited,
  recordLoginAttempt,
  generateSessionToken,
  isAuthenticated,
  getClientIp,
} from '../../middleware/adminAuth.js';
import { layout } from './templates/layout.js';

export function createAuthRoutes(): Router {
  const router = Router();

  // Login page
  router.get('/', (req: Request, res: Response) => {
    if (isAuthenticated(req)) {
      return res.redirect('/admin/dashboard');
    }

    const error = req.query.error ? '<div class="error">Invalid password</div>' : '';

    const html = layout({
      title: 'Login',
      showNav: false,
      content: `
        <h1>Anplexa Admin</h1>
        ${error}
        <div class="card">
          <form method="POST" action="/admin/login">
            <div class="form-group">
              <label for="password">Admin Password</label>
              <input type="password" id="password" name="password" required autofocus>
            </div>
            <button type="submit" class="btn">Login</button>
          </form>
        </div>
      `,
    });

    res.send(html);
  });

  // Login handler
  router.post('/login', (req: Request, res: Response) => {
    const { password } = req.body;
    const clientIp = getClientIp(req);

    if (isRateLimited(clientIp)) {
      return res.redirect('/admin?error=rate_limited');
    }

    if (!ADMIN_PASSWORD) {
      return res.redirect('/admin?error=not_configured');
    }

    const passwordMatch = password && password.length === ADMIN_PASSWORD.length &&
      crypto.timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASSWORD));

    if (passwordMatch) {
      recordLoginAttempt(clientIp, true);
      const sessionToken = generateSessionToken();
      activeSessions.set(sessionToken, { expiresAt: Date.now() + 24 * 60 * 60 * 1000 });

      res.cookie(COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });
      return res.redirect('/admin/dashboard');
    }

    recordLoginAttempt(clientIp, false);
    res.redirect('/admin?error=1');
  });

  // Logout handler
  router.get('/logout', (req: Request, res: Response) => {
    const sessionToken = req.cookies?.[COOKIE_NAME];
    if (sessionToken) {
      activeSessions.delete(sessionToken);
    }
    res.clearCookie(COOKIE_NAME);
    res.redirect('/admin');
  });

  return router;
}
