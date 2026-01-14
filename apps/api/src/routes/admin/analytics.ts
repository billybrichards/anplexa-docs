/**
 * Admin Analytics Routes
 *
 * Provides analytics dashboards and usage metrics.
 */

import { Router, type Request, type Response } from 'express';
import type { Container } from '../../container.js';
import { requireAuth } from '../../middleware/adminAuth.js';
import { layout } from './templates/layout.js';

export function createAnalyticsRoutes(container: Container): Router {
  const router = Router();

  // Main dashboard
  router.get('/dashboard', requireAuth, async (_req: Request, res: Response) => {
    try {
      const { userRepository, conversationRepository, apiKeyRepository } = container.cradle;

      const allUsers = await userRepository.getAll();
      const allConversations = await conversationRepository.getAll();
      const allApiKeys = await apiKeyRepository.getAll();

      const frontendUsers = allUsers.filter((u: any) => u.accountSource !== 'api').length;
      const apiUsers = allUsers.filter((u: any) => u.accountSource === 'api').length;

      const html = layout({
        title: 'Dashboard',
        content: `
          <h1>Dashboard</h1>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
            <div class="card" style="text-align: center;">
              <div style="font-size: 36px; color: #ff6b35; font-weight: bold;">${allUsers.length}</div>
              <div style="color: #888; margin-top: 5px;">Total Users</div>
            </div>
            <div class="card" style="text-align: center;">
              <div style="font-size: 36px; color: #6c757d; font-weight: bold;">${frontendUsers}</div>
              <div style="color: #888; margin-top: 5px;">Frontend Users</div>
            </div>
            <div class="card" style="text-align: center;">
              <div style="font-size: 36px; color: #ff6b35; font-weight: bold;">${apiUsers}</div>
              <div style="color: #888; margin-top: 5px;">API Users</div>
            </div>
            <div class="card" style="text-align: center;">
              <div style="font-size: 36px; color: #ff6b35; font-weight: bold;">${allApiKeys.filter((k: any) => k.isActive).length}</div>
              <div style="color: #888; margin-top: 5px;">Active API Keys</div>
            </div>
          </div>
          <div class="card">
            <h2>Statistics</h2>
            <table>
              <tr><td>Total Users</td><td>${allUsers.length}</td></tr>
              <tr><td>Frontend Users</td><td><span class="badge badge-secondary">${frontendUsers}</span></td></tr>
              <tr><td>API Users</td><td><span class="badge badge-api">${apiUsers}</span></td></tr>
              <tr><td>Total Conversations</td><td>${allConversations.length}</td></tr>
              <tr><td>Active API Keys</td><td>${allApiKeys.filter((k: any) => k.isActive).length}</td></tr>
            </table>
          </div>
          <div class="card">
            <h2>Quick Links</h2>
            <p><a href="/admin/users">Manage Users</a> - View and update user accounts</p>
            <p><a href="/admin/users?source=frontend">Frontend Users</a> - View users registered via frontend</p>
            <p><a href="/admin/users?source=api">API Users</a> - View users created via API</p>
            <p><a href="/admin/api-keys">API Keys</a> - Generate and manage API keys</p>
          </div>
        `,
      });

      res.send(html);
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).send(
        layout({
          title: 'Error',
          content: '<div class="error">Failed to load dashboard</div>',
        })
      );
    }
  });

  // Usage analytics
  router.get('/usage', requireAuth, async (_req: Request, res: Response) => {
    try {
      const { userRepository, apiUsageRepository, apiKeyRepository } = container.cradle;
      const today = new Date().toISOString().split('T')[0];

      const allUsage = await apiUsageRepository.getAll();
      const totalCalls = allUsage.length;
      const todayCalls = allUsage.filter((u: any) => u.createdAt?.startsWith(today)).length;

      const allApiKeys = await apiKeyRepository.getAll();
      const activeKeysCount = allApiKeys.filter((k: any) => k.isActive).length;

      const allUsers = await userRepository.getAll();
      const subscribersCount = allUsers.filter((u: any) => u.subscriptionStatus === 'subscribed').length;

      const recentUsage = allUsage.slice(0, 50);

      const keyUsageMap = new Map<string, { total: number; lastUsed: string | null }>();
      for (const usage of allUsage) {
        if (usage.apiKeyId) {
          const existing = keyUsageMap.get(usage.apiKeyId) || { total: 0, lastUsed: null };
          existing.total++;
          if (!existing.lastUsed || (usage.createdAt && usage.createdAt > existing.lastUsed)) {
            existing.lastUsed = usage.createdAt;
          }
          keyUsageMap.set(usage.apiKeyId, existing);
        }
      }

      const keyStatsRows = allApiKeys
        .map((key: any) => {
          const stats = keyUsageMap.get(key.id) || { total: 0, lastUsed: null };
          const owner = allUsers.find((u: any) => u.id === key.userId);
          return `
            <tr>
              <td><code>${key.keyPrefix}...</code></td>
              <td>${owner?.email || '-'}</td>
              <td>${stats.total}</td>
              <td>${stats.lastUsed ? new Date(stats.lastUsed).toLocaleString() : 'Never'}</td>
              <td>
                <span class="badge ${key.isActive ? 'badge-success' : 'badge-secondary'}">
                  ${key.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          `;
        })
        .join('');

      const usageRows = recentUsage
        .map((u: any) => {
          const key = allApiKeys.find((k: any) => k.id === u.apiKeyId);
          return `
            <tr>
              <td>${u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
              <td><code>${key?.keyPrefix || '-'}...</code></td>
              <td>${u.endpoint}</td>
              <td>${u.method}</td>
              <td>
                <span class="badge ${u.statusCode && u.statusCode < 400 ? 'badge-success' : u.statusCode ? 'badge-warning' : 'badge-secondary'}">
                  ${u.statusCode || '-'}
                </span>
              </td>
              <td>${u.latencyMs || '-'}</td>
            </tr>
          `;
        })
        .join('');

      const html = layout({
        title: 'Usage Analytics',
        content: `
          <h1>Usage Analytics</h1>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
            <div class="card" style="text-align: center;">
              <div style="font-size: 36px; color: #ff6b35; font-weight: bold;">${totalCalls}</div>
              <div style="color: #888; margin-top: 5px;">Total API Calls</div>
            </div>
            <div class="card" style="text-align: center;">
              <div style="font-size: 36px; color: #ff6b35; font-weight: bold;">${todayCalls}</div>
              <div style="color: #888; margin-top: 5px;">Calls Today</div>
            </div>
            <div class="card" style="text-align: center;">
              <div style="font-size: 36px; color: #ff6b35; font-weight: bold;">${activeKeysCount}</div>
              <div style="color: #888; margin-top: 5px;">Active API Keys</div>
            </div>
            <div class="card" style="text-align: center;">
              <div style="font-size: 36px; color: #ff6b35; font-weight: bold;">${subscribersCount}</div>
              <div style="color: #888; margin-top: 5px;">Total Subscribers</div>
            </div>
          </div>

          <div class="card">
            <h2>Per-Key Usage Summary</h2>
            <table>
              <thead>
                <tr>
                  <th>Key Prefix</th>
                  <th>User Email</th>
                  <th>Total Requests</th>
                  <th>Last Used</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${keyStatsRows || '<tr><td colspan="5">No API keys found</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h2>Recent Usage (Last 50 Requests)</h2>
              <a href="/admin/dashboard/usage/export" class="btn">Export CSV</a>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>API Key</th>
                  <th>Endpoint</th>
                  <th>Method</th>
                  <th>Status Code</th>
                  <th>Latency (ms)</th>
                </tr>
              </thead>
              <tbody>
                ${usageRows || '<tr><td colspan="6">No usage data found</td></tr>'}
              </tbody>
            </table>
          </div>
        `,
      });

      res.send(html);
    } catch (error) {
      console.error('Usage analytics error:', error);
      res.status(500).send(
        layout({
          title: 'Error',
          content: '<div class="error">Failed to load usage analytics</div>',
        })
      );
    }
  });

  // Export usage data as CSV
  router.get('/usage/export', requireAuth, async (_req: Request, res: Response) => {
    try {
      const { userRepository, apiUsageRepository, apiKeyRepository } = container.cradle;

      const allUsage = await apiUsageRepository.getAll();
      const allApiKeys = await apiKeyRepository.getAll();
      const allUsers = await userRepository.getAll();

      const csvHeader = 'Date/Time,API Key Prefix,User Email,Endpoint,Method,Status Code,Latency (ms),Tokens Used\n';

      const csvRows = allUsage
        .map((u: any) => {
          const key = allApiKeys.find((k: any) => k.id === u.apiKeyId);
          const user = allUsers.find((usr: any) => usr.id === u.userId);
          const dateTime = u.createdAt ? new Date(u.createdAt).toISOString() : '';
          const keyPrefix = key?.keyPrefix || '';
          const email = user?.email || '';
          const endpoint = u.endpoint?.replace(/,/g, ';') || '';
          const method = u.method || '';
          const statusCode = u.statusCode || '';
          const latency = u.latencyMs || '';
          const tokens = u.tokensUsed || 0;
          return `"${dateTime}","${keyPrefix}","${email}","${endpoint}","${method}","${statusCode}","${latency}","${tokens}"`;
        })
        .join('\n');

      const csv = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="api-usage-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error('Export usage error:', error);
      res.status(500).send('Failed to export usage data');
    }
  });

  return router;
}
