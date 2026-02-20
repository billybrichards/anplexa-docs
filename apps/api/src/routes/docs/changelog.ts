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
    body { font-family: 'Inter', sans-serif; background: linear-gradient(to bottom, #0a0a12, #12121f); color: #faf8f5; padding: 40px; min-height: 100vh; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #d4af37; font-size: 2rem; margin-bottom: 24px; }
    h3 { color: #faf8f5; margin: 0; }
    p { color: #8b8ba3; margin: 8px 0 0 0; }
    .card { background: linear-gradient(135deg, #1a1a2e 0%, #2d2d4a 100%); padding: 24px; border-radius: 12px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(212, 175, 55, 0.2); box-shadow: 0 4px 12px rgba(212, 175, 55, 0.15); transition: all 0.3s ease; }
    .card:hover { border-color: rgba(212, 175, 55, 0.4); box-shadow: 0 6px 16px rgba(212, 175, 55, 0.25); }
    .btn { background: #d4af37; color: #0a0a12; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; transition: all 0.3s ease; }
    .btn:hover { background: #f4e4a6; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4); }
    a { color: #d4af37; transition: all 0.3s ease; }
    a:hover { color: #f4e4a6; }
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
