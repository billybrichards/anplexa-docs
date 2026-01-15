/**
 * API Documentation Routes
 *
 * Serves OpenAPI/Swagger documentation.
 * Handles:
 * - GET /docs - Swagger UI
 * - GET /docs/openapi.json - OpenAPI specification
 */

import { Router, type Request, type Response } from 'express';
import type { Container } from '../../container.js';
import openapiSpec from '../../docs/openapi.json';

/**
 * Swagger UI HTML template with dark theme
 */
function getSwaggerHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Anplexa API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #0f0f1a; font-family: 'Inter', sans-serif; }

    .anplexa-header {
      background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
      padding: 16px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
    }
    .anplexa-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
    .anplexa-header nav a {
      color: white;
      text-decoration: none;
      margin-left: 20px;
      font-weight: 500;
      font-size: 0.9rem;
      opacity: 0.9;
      transition: opacity 0.2s;
    }
    .anplexa-header nav a:hover { opacity: 1; }
    .version-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .swagger-ui { background: #0f0f1a; }
    .swagger-ui .info .title { color: #f1f5f9; }
    .swagger-ui .info p, .swagger-ui .info li { color: #cbd5e1; }
    .swagger-ui .scheme-container { background: #1e1b4b; border-top: 1px solid #4c1d95; }
    .swagger-ui .opblock { border-radius: 12px; border: none; margin-bottom: 16px; }
    .swagger-ui .opblock-tag { color: #f1f5f9; border-bottom: 1px solid #4c1d95; }
    .swagger-ui .opblock-summary-path { color: #e2e8f0; }
    .swagger-ui .opblock-section-header { background: #1e1b4b; }
    .swagger-ui .opblock-body pre { background: #1e1b4b; color: #86efac; }
    .swagger-ui .responses-inner { background: #1e1b4b; }
    .swagger-ui .response-col_status { color: #10b981; }
    .swagger-ui .response-col_description { color: #e2e8f0; }
    .swagger-ui .btn.authorize { background: #6366f1; border-color: #6366f1; color: white; }
    .swagger-ui .btn.execute { background: #10b981; border-color: #10b981; color: white; }
    .swagger-ui input[type=text], .swagger-ui textarea { background: #1e1b4b; border: 1px solid #4c1d95; color: white; }
  </style>
</head>
<body>
  <div class="anplexa-header">
    <div style="display: flex; align-items: center; gap: 16px;">
      <h1>Anplexa API Docs</h1>
      <span class="version-badge">v1.0.0</span>
    </div>
    <nav>
      <a href="/">Home</a>
      <a href="/docs/export">Export</a>
      <a href="/admin">Admin</a>
    </nav>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(openapiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
}

/**
 * Create API documentation routes
 * @param container DI container (unused but required for consistency)
 */
export function createApiDocsRoutes(_container: Container): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(getSwaggerHTML());
  });

  router.get('/openapi.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Disposition', 'attachment; filename="anplexa-api-openapi.json"');
    res.json(openapiSpec);
  });

  return router;
}
