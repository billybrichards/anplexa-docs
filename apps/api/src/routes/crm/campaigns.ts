/**
 * Campaign Management Routes
 *
 * Endpoints for managing email campaigns including:
 * - View email queue
 * - Process pending emails
 * - Cancel emails
 * - View email templates with previews
 */

import { Router, type Request, type Response } from 'express';
import { desc } from 'drizzle-orm';
import type { Container, EmailScheduler } from '../../container.js';
import { requireAdminAuth } from './middleware.js';
import { renderEmailQueuePage, renderTemplatesPage } from './templates.js';

export function createCampaignRoutes(container: Container): Router {
  const router = Router();

  /**
   * GET /crm/emails
   * Display email queue with status overview
   */
  router.get('/emails', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const db = container.resolve('db');
      const { emailQueue } = require('@anplexa/database');

      const emailQueueItems = await db
        .select()
        .from(emailQueue)
        .orderBy(desc(emailQueue.createdAt))
        .limit(100);

      // Calculate statistics
      const stats = {
        pending: emailQueueItems.filter((e: any) => e.status === 'pending').length,
        sent: emailQueueItems.filter((e: any) => e.status === 'sent').length,
        failed: emailQueueItems.filter((e: any) => e.status === 'failed').length,
      };

      // Enrich with user information
      const { userRepository } = container.cradle;
      const enrichedItems = await Promise.all(
        emailQueueItems.map(async (item: any) => {
          const user = await userRepository.getById(item.userId);
          return {
            ...item,
            userEmail: user?.email || 'Unknown',
          };
        })
      );

      const html = renderEmailQueuePage({
        emailItems: enrichedItems,
        stats,
      });

      res.send(html);
    } catch (error) {
      console.error('CRM emails page error:', error);
      res.status(500).send('Failed to load email queue');
    }
  });

  /**
   * GET /crm/templates
   * Display email templates with preview
   */
  router.get('/templates', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const emailTemplates = require('../../infrastructure/email/emailTemplates.js');

      const selectedTemplate = (req.query.template as string) || 'W1';
      const persona = (req.query.persona as string) || 'curious';

      const preview = emailTemplates.getEmailPreview(selectedTemplate, 'preview-user', persona);
      const htmlBase64 = Buffer.from(preview.html).toString('base64');
      const templateList = emailTemplates.TEMPLATE_LIST;

      const html = renderTemplatesPage({
        selectedTemplate,
        persona,
        preview,
        htmlBase64,
        templateList,
      });

      res.send(html);
    } catch (error) {
      console.error('CRM templates page error:', error);
      res.status(500).send('Failed to load templates');
    }
  });

  /**
   * POST /api/crm/process-emails
   * Manually trigger email processing
   */
  router.post(
    '/api/process-emails',
    requireAdminAuth,
    async (_req: Request, res: Response) => {
      try {
        const emailScheduler = container.resolve('emailScheduler') as EmailScheduler;
        const result = await emailScheduler.processPendingEmails();
        res.json(result);
      } catch (error) {
        console.error('Process emails error:', error);
        res.status(500).json({ error: 'Failed to process emails' });
      }
    }
  );

  /**
   * POST /api/crm/invite/:userId
   * Send a waitlist invite email to a user
   */
  router.post(
    '/api/invite/:userId',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const { userRepository } = container.cradle;
        const emailScheduler = container.resolve('emailScheduler') as EmailScheduler;

        const { userId } = req.params;

        // Schedule the invite email
        await emailScheduler.scheduleWaitlistInvite(userId);

        // Update user stage
        await userRepository.update(userId, { stage: 'invited' } as any);

        res.json({ success: true });
      } catch (error) {
        console.error('Invite user error:', error);
        res.status(500).json({ error: 'Failed to invite user' });
      }
    }
  );

  return router;
}
