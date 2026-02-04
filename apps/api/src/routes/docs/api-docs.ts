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
    body { margin: 0; background: linear-gradient(to bottom, #0a0a12, #12121f); font-family: 'Inter', sans-serif; }

    .anplexa-header {
      background: linear-gradient(135deg, #1a1a2e 0%, #2d2d4a 100%);
      padding: 16px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #faf8f5;
      box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
      border-bottom: 1px solid rgba(212, 175, 55, 0.15);
    }
    .anplexa-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #d4af37; }
    .anplexa-header nav a {
      color: #faf8f5;
      text-decoration: none;
      margin-left: 20px;
      font-weight: 500;
      font-size: 0.9rem;
      opacity: 0.9;
      transition: all 0.3s ease;
    }
    .anplexa-header nav a:hover { opacity: 1; color: #d4af37; }
    .version-badge {
      background: rgba(212, 175, 55, 0.2);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #d4af37;
      border: 1px solid rgba(212, 175, 55, 0.3);
    }

    .swagger-ui { background: linear-gradient(to bottom, #0a0a12, #12121f); }
    .swagger-ui .info .title { color: #faf8f5; }
    .swagger-ui .info p, .swagger-ui .info li { color: #8b8ba3; }
    .swagger-ui .scheme-container { background: #1a1a2e; border-top: 1px solid rgba(212, 175, 55, 0.15); }
    .swagger-ui .opblock { border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.15); margin-bottom: 16px; background: #1a1a2e; }
    .swagger-ui .opblock-tag { color: #faf8f5; border-bottom: 1px solid rgba(212, 175, 55, 0.15); }
    .swagger-ui .opblock-summary-path { color: #c9b8ff; }
    .swagger-ui .opblock-section-header { background: #2d2d4a; }
    .swagger-ui .opblock-body pre { background: #1a1a2e; color: #c9b8ff; }
    .swagger-ui .responses-inner { background: #1a1a2e; }
    .swagger-ui .response-col_status { color: #d4af37; }
    .swagger-ui .response-col_description { color: #faf8f5; }
    .swagger-ui .btn.authorize { background: #d4af37; border-color: #d4af37; color: #0a0a12; font-weight: 600; }
    .swagger-ui .btn.authorize:hover { background: #f4e4a6; }
    .swagger-ui .btn.execute { background: #c9b8ff; border-color: #c9b8ff; color: #0a0a12; font-weight: 600; }
    .swagger-ui .btn.execute:hover { opacity: 0.9; }
    .swagger-ui input[type=text], .swagger-ui textarea { background: #2d2d4a; border: 1px solid rgba(212, 175, 55, 0.3); color: #faf8f5; }
    .swagger-ui input[type=text]:focus, .swagger-ui textarea:focus { border-color: #d4af37; }
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
