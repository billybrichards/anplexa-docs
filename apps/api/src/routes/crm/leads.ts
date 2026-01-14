/**
 * Lead Tracking Routes
 *
 * Endpoints for tracking lead conversion funnels including:
 * - Funnel overview (waitlist vs direct signup funnels)
 * - Email tracking (opens and clicks)
 * - Conversion analytics
 */

import { Router, type Request, type Response } from 'express';
import type { Container, EmailScheduler } from '../../container.js';
import { requireAdminAuth } from './middleware.js';
import { renderFunnelPage } from './templates.js';

export function createLeadRoutes(container: Container): Router {
  const router = Router();

  /**
   * GET /crm/funnel
   * Display funnel overview with conversion rates
   */
  router.get('/funnel', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const { userRepository } = container.cradle;

      const allUsers = await userRepository.getAll();

      // Calculate funnel statistics
      const funnelStats = {
        waitlist: {
          total: allUsers.filter((u: any) => u.funnelType === 'waitlist').length,
          new: allUsers.filter(
            (u: any) => u.funnelType === 'waitlist' && u.stage === 'waitlist'
          ).length,
          invited: allUsers.filter(
            (u: any) => u.funnelType === 'waitlist' && u.stage === 'invited'
          ).length,
          converted: allUsers.filter(
            (u: any) =>
              u.funnelType === 'waitlist' && u.subscriptionStatus === 'subscribed'
          ).length,
        },
        direct: {
          total: allUsers.filter((u: any) => u.funnelType === 'direct').length,
          new: allUsers.filter(
            (u: any) => u.funnelType === 'direct' && u.stage === 'new'
          ).length,
          usedFree: allUsers.filter(
            (u: any) =>
              u.funnelType === 'direct' && (u.usedFreeMessages || 0) >= 3
          ).length,
          converted: allUsers.filter(
            (u: any) =>
              u.funnelType === 'direct' && u.subscriptionStatus === 'subscribed'
          ).length,
        },
      };

      const html = renderFunnelPage(funnelStats);
      res.send(html);
    } catch (error) {
      console.error('CRM funnel page error:', error);
      res.status(500).send('Failed to load funnel view');
    }
  });

  /**
   * GET /track/open/:logId
   * Track email open (pixel-based tracking)
   * Returns a 1x1 transparent GIF
   */
  router.get('/track/open/:logId', async (req: Request, res: Response) => {
    try {
      const emailScheduler = container.resolve('emailScheduler') as EmailScheduler;
      const { logId } = req.params;

      await emailScheduler.trackEmailOpen(logId);

      // Return 1x1 transparent GIF
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.send(pixel);
    } catch (error) {
      console.error('Track open error:', error);
      res.status(204).send();
    }
  });

  /**
   * GET /track/click/:logId
   * Track email click and redirect to destination
   * Validates redirect URL against whitelist for security
   */
  router.get('/track/click/:logId', async (req: Request, res: Response) => {
    const ALLOWED_REDIRECT_HOSTS = ['anplexa.com', 'www.anplexa.com'];
    const DEFAULT_REDIRECT = 'https://anplexa.com/dash';

    try {
      const emailScheduler = container.resolve('emailScheduler') as EmailScheduler;
      const { logId } = req.params;
      const source = (req.query.source as string) || 'unknown';

      // Track the click
      await emailScheduler.trackEmailClick(logId, source);

      // Determine safe redirect URL
      let redirectUrl = DEFAULT_REDIRECT;
      const requestedRedirect = req.query.redirect as string;

      if (requestedRedirect) {
        try {
          const url = new URL(requestedRedirect);
          if (ALLOWED_REDIRECT_HOSTS.includes(url.hostname)) {
            redirectUrl = requestedRedirect;
          }
        } catch {
          // Invalid URL, use default
        }
      }

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Track click error:', error);
      res.redirect(DEFAULT_REDIRECT);
    }
  });

  return router;
}
