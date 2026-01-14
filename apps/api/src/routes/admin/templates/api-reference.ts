/**
 * API Reference Template
 */

export function apiReferenceTemplate(): string {
  const endpoints = [
    {
      category: 'Authentication',
      endpoints: [
        {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Register a new user account',
          auth: 'None',
          req: '{email*, password*, displayName?}',
          res: '{user, accessToken, refreshToken}',
        },
        {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login with email/password, returns JWT tokens',
          auth: 'None',
          req: '{email*, password*}',
          res: '{user, accessToken, refreshToken}',
        },
        {
          method: 'POST',
          path: '/api/auth/refresh',
          description: 'Refresh access token using refresh token',
          auth: 'None',
          req: '{refreshToken*}',
          res: '{accessToken, refreshToken}',
        },
        {
          method: 'POST',
          path: '/api/auth/logout',
          description: 'Logout and invalidate session',
          auth: 'JWT',
          req: '{refreshToken?}',
          res: '{message}',
        },
        {
          method: 'GET',
          path: '/api/auth/me',
          description: 'Get current user profile and preferences',
          auth: 'JWT/API Key',
          res: '{user, preferences}',
        },
      ],
    },
    {
      category: 'Chat (AI Companion)',
      endpoints: [
        {
          method: 'POST',
          path: '/api/chat',
          description: 'Send message with streaming SSE response',
          auth: 'JWT/API Key',
          req: '{message*, conversationId?, preferences?}',
          res: 'SSE: {type:text|done, content}',
        },
        {
          method: 'POST',
          path: '/api/chat/non-streaming',
          description: 'Send message, get complete JSON response',
          auth: 'JWT/API Key',
          req: '{message*, preferences?, newChat?}',
          res: '{response, model}',
        },
      ],
    },
    {
      category: 'Conversations',
      endpoints: [
        {
          method: 'GET',
          path: '/api/conversations',
          description: 'List all user conversations',
          auth: 'JWT/API Key',
          res: '{conversations: [{id, title, createdAt}]}',
        },
        {
          method: 'POST',
          path: '/api/conversations',
          description: 'Create a new conversation',
          auth: 'JWT/API Key',
          req: '{title?}',
          res: '{conversation}',
        },
        {
          method: 'GET',
          path: '/api/conversations/:id',
          description: 'Get conversation with messages',
          auth: 'JWT/API Key',
          res: '{conversation, messages}',
        },
        {
          method: 'DELETE',
          path: '/api/conversations/:id',
          description: 'Delete a conversation',
          auth: 'JWT/API Key',
          res: '{message}',
        },
      ],
    },
    {
      category: 'Stripe (Payments)',
      endpoints: [
        {
          method: 'GET',
          path: '/api/stripe/products',
          description: 'List available subscription products',
          auth: 'None',
          res: '{products: [{id, name, price}]}',
        },
        {
          method: 'POST',
          path: '/api/stripe/checkout',
          description: 'Create Stripe checkout session',
          auth: 'JWT',
          req: '{priceId*, successUrl?, cancelUrl?}',
          res: '{url, sessionId}',
        },
        {
          method: 'POST',
          path: '/api/stripe/webhook',
          description: 'Stripe webhook handler',
          auth: 'Stripe Signature',
          res: '{received: true}',
        },
      ],
    },
    {
      category: 'Public (No Auth)',
      endpoints: [
        {
          method: 'GET',
          path: '/api/health',
          description: 'Server health check',
          auth: 'None',
          res: '{status: ok, timestamp}',
        },
        {
          method: 'GET',
          path: '/api/health/database',
          description: 'Database connection check',
          auth: 'None',
          res: '{status, database}',
        },
      ],
    },
  ];

  const methodColors: Record<string, string> = {
    GET: '#28a745',
    POST: '#007bff',
    PUT: '#ffc107',
    DELETE: '#dc3545',
    PATCH: '#17a2b8',
  };

  let tableHtml = '';
  for (const cat of endpoints) {
    tableHtml += `<h2 style="margin-top: 30px; color: #ff6b35; border-bottom: 1px solid #333; padding-bottom: 8px;">${cat.category}</h2>`;
    tableHtml +=
      '<table style="width: 100%; margin-bottom: 20px;"><thead><tr><th style="width: 70px;">Method</th><th>Endpoint</th><th>Description</th><th style="width: 100px;">Auth</th><th>Request</th><th>Response</th></tr></thead><tbody>';
    for (const ep of cat.endpoints as any[]) {
      const color = methodColors[ep.method] || '#888';
      tableHtml += `<tr>
        <td><span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">${ep.method}</span></td>
        <td><code style="background: #2a2a2a; padding: 3px 6px; border-radius: 3px; font-size: 11px;">${ep.path}</code></td>
        <td style="font-size: 12px;">${ep.description}</td>
        <td><span style="color: #888; font-size: 11px;">${ep.auth}</span></td>
        <td><code style="font-size: 10px; color: #fbbf24; word-break: break-all;">${ep.req || '-'}</code></td>
        <td><code style="font-size: 10px; color: #86efac; word-break: break-all;">${ep.res || '-'}</code></td>
      </tr>`;
    }
    tableHtml += '</tbody></table>';
  }

  return `
    <h1>API Endpoints Reference</h1>
    <p style="color: #888; margin-bottom: 20px;">
      Complete list of all Anplexa API endpoints. For interactive documentation, visit <a href="/docs">/docs</a>.
    </p>

    <div class="card" style="margin-bottom: 30px;">
      <h3 style="color: #ff6b35; margin-bottom: 15px;">Authentication Methods</h3>
      <table>
        <tr><td><strong>JWT Bearer Token</strong></td><td><code>Authorization: Bearer &lt;token&gt;</code></td><td>User sessions from login</td></tr>
        <tr><td><strong>API Key</strong></td><td><code>X-API-Key: &lt;key&gt;</code></td><td>Server-to-server integration</td></tr>
        <tr><td><strong>Funnel API Key</strong></td><td><code>Authorization: Bearer &lt;funnel_key&gt;</code></td><td>External funnel integrations</td></tr>
      </table>
    </div>

    ${tableHtml}

    <div class="card" style="margin-top: 30px; background: #1a1a1a; border: 1px solid #333;">
      <h3 style="color: #888;">Quick Links</h3>
      <p><a href="/docs">Interactive API Documentation</a></p>
      <p><a href="/admin/funnel-keys">Manage Funnel API Keys</a></p>
      <p><a href="/admin/api-keys">Manage API Keys</a></p>
    </div>

    <div class="card" style="margin-top: 20px;">
      <h3 style="color: #ff6b35; margin-bottom: 15px;">Download</h3>
      <button onclick="downloadEndpoints()" class="btn">Download Endpoints as JSON</button>
    </div>

    <script>
    function downloadEndpoints() {
      const endpoints = ${JSON.stringify(endpoints)};
      const blob = new Blob([JSON.stringify(endpoints, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'anplexa-api-endpoints.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    </script>
  `;
}
