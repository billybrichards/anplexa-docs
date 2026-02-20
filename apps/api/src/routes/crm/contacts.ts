/**
 * Contact Management Routes
 *
 * Endpoints for managing CRM contacts (users) including:
 * - List contacts with filtering
 * - View contact details
 * - Update contact information
 */

import { Router, type Request, type Response } from 'express';
import { eq, desc, and } from 'drizzle-orm';
import type { Container, EmailScheduler } from '../../container.js';
import { requireAdminAuth } from './middleware.js';
import { renderContactsPage, renderContactDetailPage } from './templates.js';
import { emailQueue, emailLogs } from '@anplexa/database';

export function createContactRoutes(container: Container): Router {
  const router = Router();

  /**
   * GET /crm
   * Display contacts list with optional filtering by funnel, stage, and persona
   */
  router.get('/', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { userRepository } = container.cradle;

      const funnelFilter = (req.query.funnel as string) || '';
      const stageFilter = (req.query.stage as string) || '';
      const personaFilter = (req.query.persona as string) || '';

      // Fetch all users
      const allUsers = await userRepository.getAll({ limit: 100 });

      // Apply client-side filtering
      const filteredUsers = allUsers.filter((user: any) => {
        if (funnelFilter && user.funnelType !== funnelFilter) return false;
        if (stageFilter && user.stage !== stageFilter) return false;
        if (personaFilter && user.persona !== personaFilter) return false;
        return true;
      });

      // Calculate statistics
      const stats = {
        total: allUsers.length,
        waitlist: allUsers.filter((u: any) => u.funnelType === 'waitlist').length,
        direct: allUsers.filter((u: any) => u.funnelType === 'direct').length,
        converted: allUsers.filter(
          (u: any) => u.subscriptionStatus === 'subscribed'
        ).length,
      };

      const html = renderContactsPage({
        contacts: filteredUsers,
        stats,
        filters: { funnelFilter, stageFilter, personaFilter },
      });

      res.send(html);
    } catch (error) {
      console.error('CRM contacts page error:', error);
      res.status(500).send('Failed to load contacts');
    }
  });

  /**
   * GET /crm/user/:userId
   * Display detailed view of a single contact
   */
  router.get('/user/:userId', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { userRepository } = container.cradle;
      const db = container.resolve('db');

      const { userId } = req.params;

      // Fetch user
      const contactUser = await userRepository.getById(userId);

      if (!contactUser) {
        return res.status(404).send('Contact not found');
      }

      // Fetch email history
      const userEmailLogs = await db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.userId, userId))
        .orderBy(desc(emailLogs.sentAt));

      // Fetch pending emails
      const pendingEmails = await db
        .select()
        .from(emailQueue)
        .where(
          and(
            eq(emailQueue.userId, userId),
            eq(emailQueue.status, 'pending')
          )
        );

      const html = renderContactDetailPage({
        contact: contactUser,
        emailHistory: userEmailLogs,
        pendingEmails,
      });

      res.send(html);
    } catch (error) {
      console.error('CRM contact detail page error:', error);
      res.status(500).send('Failed to load contact');
    }
  });

  /**
   * POST /api/crm/cancel-email/:id
   * Cancel a pending email
   */
  router.post(
    '/api/cancel-email/:id',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const db = container.resolve('db');

        const { id } = req.params;

        await db
          .update(emailQueue)
          .set({ status: 'cancelled' })
          .where(eq(emailQueue.id, id));

        res.json({ success: true });
      } catch (error) {
        console.error('Cancel email error:', error);
        res.status(500).json({ error: 'Failed to cancel email' });
      }
    }
  );

  /**
   * POST /api/crm/cancel-all-emails/:userId
   * Cancel all pending emails for a contact
   */
  router.post(
    '/api/cancel-all-emails/:userId',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const emailScheduler = container.resolve('emailScheduler') as EmailScheduler;
        const { userId } = req.params;

        await emailScheduler.cancelPendingEmails(userId);
        res.json({ success: true });
      } catch (error) {
        console.error('Cancel all emails error:', error);
        res.status(500).json({ error: 'Failed to cancel emails' });
      }
    }
  );

  /**
   * POST /api/crm/update-stage/:userId
   * Update contact's stage in the funnel
   */
  router.post(
    '/api/update-stage/:userId',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const { userRepository } = container.cradle;
        const { stage } = req.body;

        if (!stage) {
          return res.status(400).json({ error: 'Stage is required' });
        }

        await userRepository.update(req.params.userId, { stage } as any);

        res.json({ success: true });
      } catch (error) {
        console.error('Update stage error:', error);
        res.status(500).json({ error: 'Failed to update stage' });
      }
    }
  );

  return router;
}
