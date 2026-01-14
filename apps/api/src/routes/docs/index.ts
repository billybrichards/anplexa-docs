/**
 * Documentation Routes
 *
 * Aggregates all documentation-related routes:
 * - API docs (Swagger UI)
 * - Release notes (interactive endpoint reference)
 * - Changelog & exports (download specification)
 *
 * Usage:
 * ```typescript
 * import { createDocsRoutes } from './routes/docs/index.js';
 * app.use('/docs', createDocsRoutes(container));
 * ```
 */

import { Router } from 'express';
import type { Container } from '../../container.js';
import { createApiDocsRoutes } from './api-docs.js';
import { createReleaseNotesRoutes } from './release-notes.js';
import { createChangelogRoutes } from './changelog.js';

/**
 * Create combined documentation routes
 */
export function createDocsRoutes(container: Container): Router {
  const router = Router();

  // Mount all docs sub-routes
  router.use('/', createApiDocsRoutes(container));
  router.use('/', createReleaseNotesRoutes(container));
  router.use('/', createChangelogRoutes(container));

  return router;
}

// Export individual route creators for flexibility
export { createApiDocsRoutes } from './api-docs.js';
export { createReleaseNotesRoutes } from './release-notes.js';
export { createChangelogRoutes } from './changelog.js';
