/**
 * CRM Routes Barrel Export
 *
 * Aggregates and exports all CRM route modules
 * Provides a single entry point for mounting CRM routes in the Express app
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createContactRoutes } from './contacts.js';
import { createCampaignRoutes } from './campaigns.js';
import { createLeadRoutes } from './leads.js';

/**
 * Create and mount all CRM routes
 * Returns a combined router with all domain-specific sub-routes
 *
 * Route structure:
 * - /crm/* - Contact and user management
 * - /crm/emails - Email queue management
 * - /crm/templates - Email template management
 * - /crm/funnel - Lead funnel analytics
 * - /crm/track/* - Email tracking endpoints
 * - /crm/api/* - API endpoints for CRM operations
 */
export function createCrmRoutes(container: Container): Router {
  const router = Router();

  // Mount domain-specific routes
  router.use('/', createContactRoutes(container));
  router.use('/', createCampaignRoutes(container));
  router.use('/', createLeadRoutes(container));

  return router;
}

// Export individual route creators for flexibility
export { createContactRoutes } from './contacts.js';
export { createCampaignRoutes } from './campaigns.js';
export { createLeadRoutes } from './leads.js';
