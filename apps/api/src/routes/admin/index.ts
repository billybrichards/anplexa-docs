/**
 * Admin Routes
 *
 * Main router that combines all admin functionality:
 * - Authentication (login/logout)
 * - User management
 * - Analytics and usage metrics
 * - Settings (API keys, funnel keys, system prompts, API reference)
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createAuthRoutes } from './auth.js';
import { createUserManagementRoutes } from './users.js';
import { createAnalyticsRoutes } from './analytics.js';
import { createSettingsRoutes } from './settings.js';

export function createAdminRoutes(container: Container): Router {
  const router = Router();

  // Authentication routes (/, /login, /logout)
  const authRoutes = createAuthRoutes();
  router.use('/', authRoutes);

  // User management routes (/users)
  const userRoutes = createUserManagementRoutes(container);
  router.use('/users', userRoutes);

  // Analytics routes (/dashboard, /dashboard/usage)
  const analyticsRoutes = createAnalyticsRoutes(container);
  router.use('/', analyticsRoutes);

  // Settings routes (/api-keys, /funnel-keys, /api-reference)
  const settingsRoutes = createSettingsRoutes(container);
  router.use('/', settingsRoutes);

  return router;
}
