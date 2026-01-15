/**
 * Release Notes Routes
 *
 * Serves interactive endpoint reference documentation.
 * Handles:
 * - GET /docs/1384/endpoints-public - Complete interactive endpoint reference
 */

import { Router, type Request, type Response } from 'express';
import type { Container } from '../../container.js';

interface Endpoint {
  method: string;
  path: string;
  description: string;
  auth: string;
  requestBody?: {
    required?: string[];
    properties?: Record<string, any>;
  };
  response?: Record<string, any>;
  pathParams?: Record<string, string>;
}

interface EndpointCategory {
  category: string;
  description: string;
  endpoints: Endpoint[];
}

/**
 * Generate interactive endpoint documentation HTML
 */
function generateEndpointsHTML(categories: EndpointCategory[]): string {
  const methodColors: Record<string, string> = {
    GET: '#28a745',
    POST: '#007bff',
    PUT: '#ffc107',
    DELETE: '#dc3545',
    PATCH: '#17a2b8',
  };

  let endpointsHtml = '';
  for (const cat of categories) {
    endpointsHtml += `<div class="category" id="${cat.category.toLowerCase().replace(/[^a-z]/g, '-')}">
      <h2>${cat.category}</h2>
      <p class="cat-desc">${cat.description}</p>`;

    for (const ep of cat.endpoints) {
      const color = methodColors[ep.method] || '#888';
      const endpointId = `${ep.method}-${ep.path}`.replace(/[^a-zA-Z0-9]/g, '-');

      let detailsHtml = '';
      if (ep.pathParams) {
        detailsHtml +=
          '<div class="section"><h4>Path Parameters</h4><div class="schema">' +
          Object.entries(ep.pathParams)
            .map(([k, v]) => `<div class="prop"><span class="key">${k}</span>: <span class="type">${v}</span></div>`)
            .join('') +
          '</div></div>';
      }
      if (ep.requestBody) {
        const reqProps = ep.requestBody.properties || {};
        const required = ep.requestBody.required || [];
        detailsHtml += '<div class="section"><h4>Request Body</h4><div class="schema">';
        for (const [key, val] of Object.entries(reqProps) as [string, any][]) {
          const isReq = required.includes(key);
          const typeStr = val.enum ? val.enum.map((e: string) => `"${e}"`).join(' | ') : val.type || 'any';
          detailsHtml += `<div class="prop"><span class="key">${key}${isReq ? ' *' : ''}</span>: <span class="type">${typeStr}</span>${val.example ? ` <span class="example">e.g. ${JSON.stringify(val.example)}</span>` : ''}${val.description ? ` <span class="desc">${val.description}</span>` : ''}</div>`;
        }
        detailsHtml += '</div></div>';
      }
      if (ep.response) {
        detailsHtml += '<div class="section"><h4>Response</h4>';
        for (const [code, schema] of Object.entries(ep.response)) {
          detailsHtml += `<div class="response-code"><span class="code ${code.startsWith('2') ? 'success' : 'error'}">${code}</span></div><div class="schema"><pre>${JSON.stringify(schema, null, 2)}</pre></div>`;
        }
        detailsHtml += '</div>';
      }

      endpointsHtml += `
        <div class="endpoint">
          <div class="endpoint-header" onclick="toggleDetails('${endpointId}')">
            <span class="method" style="background:${color}">${ep.method}</span>
            <code class="path">${ep.path}</code>
            <span class="auth-badge">${ep.auth}</span>
            <span class="expand-icon" id="icon-${endpointId}">+</span>
          </div>
          <p class="endpoint-desc">${ep.description}</p>
          <div class="endpoint-details" id="${endpointId}">${detailsHtml}</div>
        </div>`;
    }
    endpointsHtml += '</div>';
  }

  const toc = categories.map((c) => `<a href="#${c.category.toLowerCase().replace(/[^a-z]/g, '-')}">${c.category}</a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anplexa API - Complete Interactive Documentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0f0a1a; color: #e2e8f0; line-height: 1.6; }
    code, pre { font-family: 'Fira Code', monospace; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 24px 40px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 1.5rem; font-weight: 700; color: white; }
    .header .version { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; color: white; margin-left: 12px; }
    .header nav a { color: white; text-decoration: none; margin-left: 24px; font-weight: 500; opacity: 0.9; }
    .header nav a:hover { opacity: 1; }
    .layout { display: flex; max-width: 1600px; margin: 0 auto; }
    .sidebar { width: 260px; background: #1a1025; padding: 24px; position: sticky; top: 0; height: 100vh; overflow-y: auto; border-right: 1px solid #2d1f42; }
    .sidebar h3 { color: #a78bfa; margin-bottom: 16px; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 1px; }
    .sidebar a { display: block; color: #94a3b8; text-decoration: none; padding: 8px 12px; border-radius: 6px; margin-bottom: 4px; font-size: 0.875rem; }
    .sidebar a:hover { background: #2d1f42; color: #e2e8f0; }
    .main { flex: 1; padding: 40px; min-width: 0; }
    .intro { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px; border-radius: 16px; margin-bottom: 40px; border: 1px solid #4c1d95; }
    .intro h1 { font-size: 2rem; margin-bottom: 12px; }
    .intro p { color: #a5b4fc; margin-bottom: 20px; }
    .auth-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 24px; }
    .auth-card { background: rgba(0,0,0,0.3); padding: 16px; border-radius: 10px; border: 1px solid #4c1d95; }
    .auth-card h4 { color: #86efac; margin-bottom: 8px; }
    .auth-card code { color: #fbbf24; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
    .auth-card p { color: #94a3b8; font-size: 0.85rem; margin-top: 8px; }
    .buttons { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px; }
    .btn { padding: 10px 20px; border-radius: 8px; font-weight: 500; text-decoration: none; border: none; cursor: pointer; font-size: 0.9rem; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-primary:hover { background: #4f46e5; }
    .btn-secondary { background: #4c1d95; color: white; }
    .btn-secondary:hover { background: #5b21b6; }
    .category { margin-bottom: 48px; }
    .category h2 { color: #a78bfa; font-size: 1.5rem; margin-bottom: 8px; padding-bottom: 12px; border-bottom: 2px solid #4c1d95; }
    .cat-desc { color: #94a3b8; margin-bottom: 20px; }
    .endpoint { background: #1a1025; border: 1px solid #2d1f42; border-radius: 12px; margin-bottom: 12px; overflow: hidden; transition: all 0.2s; }
    .endpoint:hover { border-color: #4c1d95; }
    .endpoint-header { display: flex; align-items: center; padding: 16px 20px; cursor: pointer; gap: 12px; flex-wrap: wrap; }
    .method { padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; color: white; text-transform: uppercase; }
    .path { color: #86efac; background: rgba(0,0,0,0.3); padding: 6px 12px; border-radius: 6px; flex: 1; min-width: 200px; }
    .auth-badge { background: #312e81; color: #a5b4fc; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; }
    .expand-icon { color: #6366f1; font-size: 1.2rem; font-weight: bold; margin-left: auto; }
    .endpoint-desc { padding: 0 20px 16px; color: #94a3b8; font-size: 0.9rem; }
    .endpoint-details { display: none; padding: 0 20px 20px; border-top: 1px solid #2d1f42; margin-top: 8px; padding-top: 16px; }
    .endpoint-details.open { display: block; }
    .section { margin-bottom: 20px; }
    .section h4 { color: #a78bfa; margin-bottom: 12px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .schema { background: rgba(0,0,0,0.4); padding: 16px; border-radius: 8px; }
    .schema pre { color: #86efac; font-size: 0.85rem; white-space: pre-wrap; word-break: break-word; }
    .prop { padding: 6px 0; border-bottom: 1px solid #2d1f42; }
    .prop:last-child { border-bottom: none; }
    .key { color: #a78bfa; font-weight: 600; }
    .type { color: #86efac; }
    .example { color: #fbbf24; font-size: 0.8rem; margin-left: 8px; }
    .desc { color: #64748b; font-size: 0.8rem; display: block; margin-top: 4px; }
    .response-code { margin-bottom: 8px; }
    .code { padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
    .code.success { background: #065f46; color: #6ee7b7; }
    .code.error { background: #7f1d1d; color: #fca5a5; }
    .footer { text-align: center; padding: 40px; color: #64748b; border-top: 1px solid #2d1f42; margin-top: 60px; }
    .footer a { color: #a78bfa; }
    @media (max-width: 900px) { .sidebar { display: none; } .layout { flex-direction: column; } }
  </style>
</head>
<body>
  <div class="header">
    <div style="display:flex;align-items:center;">
      <h1>Anplexa API</h1>
      <span class="version">v1.0.0</span>
    </div>
    <nav>
      <a href="/">Home</a>
      <a href="/docs">Swagger UI</a>
      <a href="/docs/openapi.json" download>OpenAPI JSON</a>
      <a href="/admin">Admin</a>
    </nav>
  </div>

  <div class="layout">
    <div class="sidebar">
      <h3>Navigation</h3>
      ${toc}
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #2d1f42;">
        <a href="/docs" style="color:#6366f1;">Swagger Docs</a>
        <a href="/docs/openapi.json" download>Download OpenAPI</a>
      </div>
    </div>

    <div class="main">
      <div class="intro">
        <h1>Complete API Reference</h1>
        <p>Full interactive documentation for the Anplexa Unrestricted AI Companion API. Click any endpoint to expand request/response details.</p>

        <div class="auth-cards">
          <div class="auth-card">
            <h4>JWT Bearer Token</h4>
            <code>Authorization: Bearer &lt;token&gt;</code>
            <p>User sessions from /api/auth/login. 15min access, 7day refresh.</p>
          </div>
          <div class="auth-card">
            <h4>API Key</h4>
            <code>X-API-Key: &lt;key&gt;</code>
            <p>Server-to-server. Generate in Settings or via /api/settings/api-key.</p>
          </div>
          <div class="auth-card">
            <h4>Funnel API Key</h4>
            <code>Authorization: Bearer &lt;FUNNEL_API_SECRET&gt;</code>
            <p>External funnel integrations. Set via environment variable.</p>
          </div>
          <div class="auth-card">
            <h4>Webhook Secret</h4>
            <code>stripe-signature / webhook-secret header</code>
            <p>Signed payloads for webhooks. Verified server-side.</p>
          </div>
        </div>

        <div class="buttons">
          <button onclick="downloadEndpoints()" class="btn btn-primary">Download as JSON</button>
          <a href="/docs/openapi.json" class="btn btn-secondary" download>OpenAPI Spec</a>
          <a href="/docs" class="btn btn-secondary">Swagger UI</a>
        </div>
      </div>

      ${endpointsHtml}

      <div class="footer">
        <p>Anplexa API &copy; ${new Date().getFullYear()} | <a href="/docs">Swagger</a> | <a href="/">Home</a> | <a href="/admin">Admin</a></p>
      </div>
    </div>
  </div>

  <script>
  function toggleDetails(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById('icon-' + id);
    const isOpen = el.classList.contains('open');

    document.querySelectorAll('.endpoint-details').forEach(detail => {
      detail.classList.remove('open');
      const otherId = detail.id;
      const otherIcon = document.getElementById('icon-' + otherId);
      if (otherIcon) otherIcon.textContent = '+';
    });

    if (!isOpen) {
      el.classList.add('open');
      icon.textContent = '−';
    } else {
      el.classList.remove('open');
      icon.textContent = '+';
    }
  }

  function downloadEndpoints() {
    const endpoints = ${JSON.stringify(categories)};
    const blob = new Blob([JSON.stringify(endpoints, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anplexa-api-full-documentation.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  </script>
</body>
</html>`;
}

/**
 * Get endpoint categories data
 */
function getEndpointCategories(): EndpointCategory[] {
  return [
    {
      category: 'Authentication',
      description: 'User registration, login, and session management',
      endpoints: [
        {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Register a new user account. First user automatically becomes admin.',
          auth: 'None',
          requestBody: {
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email', example: 'user@example.com' },
              password: { type: 'string', minLength: 6, example: 'password123' },
              displayName: { type: 'string', example: 'John Doe' },
            },
          },
          response: {
            '201': {
              message: 'string',
              user: { id: 'string (UUID)', email: 'string', displayName: 'string', isAdmin: 'boolean' },
              accessToken: 'string (JWT)',
              refreshToken: 'string (JWT)',
            },
            '400': { error: 'Email already registered' },
          },
        },
        {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Authenticate with email and password to receive JWT tokens.',
          auth: 'None',
          requestBody: {
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email', example: 'user@example.com' },
              password: { type: 'string', example: 'password123' },
            },
          },
          response: {
            '200': {
              message: 'Login successful',
              user: { id: 'string', email: 'string', displayName: 'string', isAdmin: 'boolean' },
              accessToken: 'string (JWT, 15min expiry)',
              refreshToken: 'string (JWT, 7day expiry)',
            },
            '401': { error: 'Invalid email or password' },
          },
        },
      ],
    },
    {
      category: 'Chat',
      description: 'Send messages to the AI companion with streaming or non-streaming responses',
      endpoints: [
        {
          method: 'POST',
          path: '/api/chat',
          description: 'Send a message and receive a streaming SSE response from the AI companion.',
          auth: 'JWT / API Key',
          requestBody: {
            required: ['message'],
            properties: {
              message: { type: 'string', maxLength: 10000, example: 'Hello, how are you?' },
              conversationId: { type: 'string (UUID)', description: 'Continue existing conversation' },
              preferences: {
                type: 'object',
                properties: {
                  length: { type: 'string', enum: ['brief', 'moderate', 'detailed'], default: 'moderate' },
                  style: { type: 'string', enum: ['casual', 'thoughtful', 'creative'], default: 'thoughtful' },
                },
              },
            },
          },
          response: {
            '200 (SSE Stream)': {
              'Content-Type': 'text/event-stream',
              events: [
                'data: {"type":"text","content":"chunk of response"}',
                'data: {"type":"done","conversationId":"uuid","userMessageId":"uuid","assistantMessageId":"uuid"}',
              ],
            },
            '403': {
              errorCode: 'CREDIT_LIMIT_REACHED',
              error: 'Credits exhausted',
              message: 'All used up for today...',
              credits: 0,
              maxCredits: 5,
              resetsAt: 'ISO8601 datetime',
            },
          },
        },
      ],
    },
    {
      category: 'Conversations',
      description: 'Manage conversation history and messages',
      endpoints: [
        {
          method: 'GET',
          path: '/api/conversations',
          description: 'List all conversations for the authenticated user.',
          auth: 'JWT / API Key',
          response: {
            '200': {
              conversations: [
                {
                  id: 'string (UUID)',
                  userId: 'string (UUID)',
                  title: 'string',
                  createdAt: 'ISO8601 datetime',
                  updatedAt: 'ISO8601 datetime',
                },
              ],
            },
          },
        },
      ],
    },
  ];
}

/**
 * Create release notes routes
 */
export function createReleaseNotesRoutes(_container: Container): Router {
  const router = Router();

  /**
   * GET /docs/1384/endpoints-public - Interactive endpoint reference
   */
  router.get('/1384/endpoints-public', (_req: Request, res: Response) => {
    const categories = getEndpointCategories();
    const html = generateEndpointsHTML(categories);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  return router;
}
