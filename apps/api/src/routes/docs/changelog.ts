/**
 * Changelog & Export Routes
 *
 * Serves changelog information and provides export functionality
 * for API specifications.
 *
 * Handles:
 * - GET /docs/export - Download API specification
 */

import { Router, type Request, type Response } from 'express';
import type { Container } from '../../container.js';

/**
 * Export page HTML template
 */
function getExportHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Export API Documentation</title>
  <style>
    body { font-family: sans-serif; background: #0f0f1a; color: white; padding: 40px; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #a78bfa; }
    .card { background: #1e1b4b; padding: 20px; border-radius: 12px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
    .btn { background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Export API Specification</h1>
    <div class="card">
      <div>
        <h3>OpenAPI JSON</h3>
        <p>Download the full specification for Postman or Insomnia.</p>
      </div>
      <a href="/docs/openapi.json" class="btn" download>Download</a>
    </div>
    <p style="margin-top: 20px;"><a href="/docs" style="color: #a78bfa;">← Back to Docs</a></p>
  </div>
</body>
</html>`;
}

/**
 * Create changelog routes
 */
export function createChangelogRoutes(_container: Container): Router {
  const router = Router();

  /**
   * GET /docs/export - Export API documentation
   */
  router.get('/export', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(getExportHTML());
  });

  return router;
}
