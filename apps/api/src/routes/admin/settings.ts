/**
 * Admin Settings Routes
 *
 * Manages API keys, funnel keys, system prompts, and API reference.
 */

import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { Container } from '../../container.js';
import { requireAuth } from '../../middleware/adminAuth.js';
import { layout, escapeHtml } from './templates/layout.js';
import { eq, desc } from '@anplexa/database';
import * as schema from '@anplexa/database';
import { apiReferenceTemplate } from './templates/api-reference.js';

export function createSettingsRoutes(container: Container): Router {
  const router = Router();

  // ==================== API KEYS ====================

  router.get('/api-keys', requireAuth, async (req: Request, res: Response) => {
    try {
      const { apiKeyRepository } = container.cradle;

      const allKeys = await apiKeyRepository.getAll();

      const newKey = req.query.newKey as string;
      const success = req.query.success ? '<div class="success">API key revoked</div>' : '';

      const keyRows = allKeys
        .map(
          (key: any) => `
          <tr>
            <td>${escapeHtml(key.name)}</td>
            <td><code>${key.keyPrefix}...</code></td>
            <td>
              <span class="badge ${key.isActive ? 'badge-success' : 'badge-secondary'}">
                ${key.isActive ? 'Active' : 'Revoked'}
              </span>
            </td>
            <td>${key.lastUsedAt || 'Never'}</td>
            <td>${key.createdAt}</td>
            <td>
              ${
                key.isActive
                  ? `
                <form method="POST" action="/admin/api-keys/${key.id}/delete" style="display: inline;" data-confirm="Revoke this API key?">
                  <button type="submit" class="btn btn-sm btn-danger">Revoke</button>
                </form>
              `
                  : '-'
              }
            </td>
          </tr>
        `
        )
        .join('');

      const html = layout({
        title: 'API Keys',
        content: `
          <h1>API Key Management</h1>
          ${success}
          ${
            newKey
              ? `
            <div class="card">
              <h2>New API Key Generated</h2>
              <p style="color: #ffc107; margin-bottom: 10px;">⚠️ Copy this key now - it will not be shown again!</p>
              <div class="api-key-display" id="newKeyDisplay">${escapeHtml(newKey)}</div>
              <button id="copyKeyBtn" class="btn" style="margin-top: 15px;">Copy to Clipboard</button>
            </div>
          `
              : ''
          }
          <div class="card">
            <h2>Generate New API Key</h2>
            <form method="POST" action="/admin/api-keys">
              <div class="form-group">
                <label for="name">Key Name</label>
                <input type="text" id="name" name="name" required placeholder="e.g., Production Server">
              </div>
              <button type="submit" class="btn">Generate Key</button>
            </form>
          </div>
          <h2>Existing Keys</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Prefix</th>
                <th>Status</th>
                <th>Last Used</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${keyRows || '<tr><td colspan="6">No API keys found</td></tr>'}
            </tbody>
          </table>
        `,
      });

      res.send(html);
    } catch (error) {
      console.error('API keys list error:', error);
      res.status(500).send(
        layout({
          title: 'Error',
          content: '<div class="error">Failed to load API keys</div>',
        })
      );
    }
  });

  router.post('/api-keys', requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = container.cradle;
      const { name } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).send(
          layout({
            title: 'Error',
            content: '<div class="error">Key name is required</div>',
          })
        );
      }

      const rawKey = `tc_${crypto.randomBytes(32).toString('hex')}`;
      const keyPrefix = rawKey.substring(0, 8);
      const keyHash = await bcrypt.hash(rawKey, 10);
      const id = uuidv4();

      // Note: apiKeys table is not covered by current repositories
      await db.insert(schema.apiKeys).values({
        id,
        name: name.trim(),
        keyHash,
        keyPrefix,
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      res.redirect(`/admin/api-keys?newKey=${encodeURIComponent(rawKey)}`);
    } catch (error) {
      console.error('Generate API key error:', error);
      res.status(500).send(
        layout({
          title: 'Error',
          content: '<div class="error">Failed to generate API key</div>',
        })
      );
    }
  });

  router.post('/api-keys/:id/delete', requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = container.cradle;
      const { id } = req.params;

      // Note: apiKeys table is not covered by current repositories
      await db.update(schema.apiKeys).set({ isActive: false }).where(eq(schema.apiKeys.id, id));
      res.redirect('/admin/api-keys?success=1');
    } catch (error) {
      console.error('Revoke API key error:', error);
      res.status(500).send(
        layout({
          title: 'Error',
          content: '<div class="error">Failed to revoke API key</div>',
        })
      );
    }
  });

  // ==================== FUNNEL KEYS ====================

  router.get('/funnel-keys', requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = container.cradle;

      // Note: funnelApiKeys table is not covered by current repositories
      const allFunnelKeys = await db.select().from(schema.funnelApiKeys).orderBy(desc(schema.funnelApiKeys.createdAt));
      const newKeyDisplay = req.query.newKey as string | undefined;

      const keysTable =
        allFunnelKeys.length === 0
          ? '<p style="color: #888;">No funnel API keys created yet.</p>'
          : `<table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key Prefix</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Used</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${allFunnelKeys
                  .map(
                    (k: any) => `
                  <tr>
                    <td>${escapeHtml(k.name || 'Funnel API Key')}</td>
                    <td><code style="background:#2a2a2a;padding:3px 6px;border-radius:3px;">${k.keyPrefix}...</code></td>
                    <td><span class="badge ${k.isActive ? 'badge-success' : 'badge-secondary'}">${k.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>${k.createdAt ? new Date(k.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>${k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <form method="POST" action="/admin/funnel-keys/${k.id}/toggle" style="display:inline;">
                        <button type="submit" class="btn btn-sm ${k.isActive ? 'btn-danger' : ''}">${k.isActive ? 'Deactivate' : 'Activate'}</button>
                      </form>
                      <form method="POST" action="/admin/funnel-keys/${k.id}/delete" style="display:inline;margin-left:5px;" data-confirm="Delete this key?">
                        <button type="submit" class="btn btn-sm btn-danger">Delete</button>
                      </form>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>`;

      const html = layout({
        title: 'Funnel API Keys',
        content: `
          <h1>Funnel API Keys</h1>
          <p style="color: #888; margin-bottom: 20px;">
            Funnel API keys are used by external funnels (Anplexa landing pages, lead capture forms) to create users and manage subscriptions via the Funnel API.
          </p>

          ${
            newKeyDisplay
              ? `
            <div class="card" style="border: 2px solid #28a745; margin-bottom: 20px;">
              <h3 style="color: #28a745; margin-bottom: 15px;">New Funnel API Key Created</h3>
              <p style="color: #ff6b35; margin-bottom: 10px;"><strong>Copy this key now - it will not be shown again!</strong></p>
              <div class="api-key-display" id="newKeyDisplay">${escapeHtml(newKeyDisplay)}</div>
              <button id="copyKeyBtn" class="btn" style="margin-top: 15px;">Copy to Clipboard</button>
            </div>
          `
              : ''
          }

          <div class="card">
            <h2>Generate New Funnel API Key</h2>
            <form method="POST" action="/admin/funnel-keys/generate">
              <div class="form-group">
                <label for="keyName">Key Name (optional)</label>
                <input type="text" id="keyName" name="keyName" placeholder="e.g., Anplexa Main Funnel">
              </div>
              <div class="form-group">
                <label for="notes">Notes (optional)</label>
                <input type="text" id="notes" name="notes" placeholder="e.g., Used for Instagram campaign">
              </div>
              <button type="submit" class="btn">Generate New Key</button>
            </form>
          </div>

          <div class="card">
            <h2>Existing Funnel Keys</h2>
            ${keysTable}
          </div>

          <div class="card" style="background: #1a1a1a; border: 1px solid #333;">
            <h3 style="color: #888;">Usage</h3>
            <p style="color: #666; font-size: 13px;">
              Include the funnel API key in requests to the Funnel API:
            </p>
            <pre style="background: #0a0a0a; padding: 15px; border-radius: 5px; overflow-x: auto; margin-top: 10px;">
Authorization: Bearer YOUR_FUNNEL_API_KEY

POST /api/funnel/users
POST /api/funnel/checkout
GET /api/funnel/subscription/:userId
            </pre>
          </div>
        `,
      });

      res.send(html);
    } catch (error) {
      console.error('Funnel keys page error:', error);
      res.status(500).send('Failed to load funnel keys');
    }
  });

  router.post('/funnel-keys/generate', requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = container.cradle;
      const { keyName, notes } = req.body;
      const rawKey = `fk_${crypto.randomBytes(24).toString('hex')}`;
      const keyHash = await bcrypt.hash(rawKey, 10);
      const keyPrefix = rawKey.slice(0, 12);

      // Note: funnelApiKeys table is not covered by current repositories
      await db.insert(schema.funnelApiKeys).values({
        id: uuidv4(),
        name: keyName || 'Funnel API Key',
        keyHash,
        keyPrefix,
        isActive: true,
        createdAt: new Date().toISOString(),
        notes: notes || null,
      });

      res.redirect(`/admin/funnel-keys?newKey=${encodeURIComponent(rawKey)}`);
    } catch (error) {
      console.error('Generate funnel key error:', error);
      res.status(500).send('Failed to generate funnel key');
    }
  });

  router.post('/funnel-keys/:id/toggle', requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = container.cradle;
      const { id } = req.params;

      // Note: funnelApiKeys table is not covered by current repositories
      const [existing] = await db.select().from(schema.funnelApiKeys).where(eq(schema.funnelApiKeys.id, id));

      if (existing) {
        await db
          .update(schema.funnelApiKeys)
          .set({ isActive: !existing.isActive })
          .where(eq(schema.funnelApiKeys.id, id));
      }

      res.redirect('/admin/funnel-keys');
    } catch (error) {
      console.error('Toggle funnel key error:', error);
      res.status(500).send('Failed to toggle key');
    }
  });

  router.post('/funnel-keys/:id/delete', requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = container.cradle;
      const { id } = req.params;

      // Note: funnelApiKeys table is not covered by current repositories
      await db.delete(schema.funnelApiKeys).where(eq(schema.funnelApiKeys.id, id));
      res.redirect('/admin/funnel-keys');
    } catch (error) {
      console.error('Delete funnel key error:', error);
      res.status(500).send('Failed to delete key');
    }
  });

  // ==================== API REFERENCE ====================

  router.get('/api-reference', requireAuth, (_req: Request, res: Response) => {
    const html = layout({
      title: 'API Reference',
      content: apiReferenceTemplate(),
    });
    res.send(html);
  });

  return router;
}
