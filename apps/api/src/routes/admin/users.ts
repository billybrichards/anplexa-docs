/**
 * Admin User Management Routes
 *
 * Provides UI and actions for managing users, subscriptions, and credits.
 */

import { Router, type Request, type Response } from 'express';
import type { Container } from '../../container.js';
import { requireAuth } from '../../middleware/adminAuth.js';
import { layout, escapeHtml } from './templates/layout.js';
import { eq, userFeedback } from '@anplexa/database';

export function createUserManagementRoutes(container: Container): Router {
  const router = Router();

  // List all users with filtering
  router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userRepository } = container.cradle;
      const sourceFilter = req.query.source as string | undefined;

      let allUsers = await userRepository.getAll();

      const totalCount = allUsers.length;
      const frontendCount = allUsers.filter((u: any) => u.accountSource !== 'api').length;
      const apiCount = allUsers.filter((u: any) => u.accountSource === 'api').length;

      if (sourceFilter === 'frontend') {
        allUsers = allUsers.filter((u: any) => u.accountSource !== 'api');
      } else if (sourceFilter === 'api') {
        allUsers = allUsers.filter((u: any) => u.accountSource === 'api');
      }

      const success = req.query.success ? '<div class="success">User updated successfully</div>' : '';
      const deleted = req.query.deleted ? '<div class="success">User deleted successfully</div>' : '';

      const userRows = allUsers
        .map((user: any) => {
          const isApiUser = user.accountSource === 'api';
          return `
          <tr>
            <td>${escapeHtml(user.email)}</td>
            <td>${user.displayName ? escapeHtml(user.displayName) : '-'}</td>
            <td>
              <span class="badge ${isApiUser ? 'badge-api' : 'badge-secondary'}">
                ${isApiUser ? 'API' : 'Frontend'}
              </span>
            </td>
            <td>
              <span class="badge ${user.subscriptionStatus === 'subscribed' ? 'badge-success' : 'badge-secondary'}">
                ${user.subscriptionStatus || 'not_subscribed'}
              </span>
            </td>
            <td>${user.credits || 0}</td>
            <td>${user.isAdmin ? 'Yes' : 'No'}</td>
            <td>
              <form method="POST" action="/admin/users/${user.id}" style="display: inline-flex; gap: 5px; align-items: center;">
                <select name="subscriptionStatus" style="width: 120px;">
                  <option value="not_subscribed" ${user.subscriptionStatus !== 'subscribed' ? 'selected' : ''}>Not Subscribed</option>
                  <option value="subscribed" ${user.subscriptionStatus === 'subscribed' ? 'selected' : ''}>Subscribed</option>
                </select>
                <input type="number" name="credits" value="${user.credits || 0}" style="width: 80px;">
                <button type="submit" class="btn btn-sm">Update</button>
              </form>
              <form method="POST" action="/admin/users/${user.id}/delete" style="display: inline; margin-left: 5px;" data-confirm="Delete this user and all their data?">
                <button type="submit" class="btn btn-sm btn-danger">Delete</button>
              </form>
            </td>
          </tr>
        `;
        })
        .join('');

      const html = layout({
        title: 'Users',
        content: `
          <h1>User Management</h1>
          ${success}${deleted}
          <div class="filter-tabs">
            <a href="/admin/users" class="filter-tab ${!sourceFilter ? 'active' : ''}">All (${totalCount})</a>
            <a href="/admin/users?source=frontend" class="filter-tab ${sourceFilter === 'frontend' ? 'active' : ''}">Frontend (${frontendCount})</a>
            <a href="/admin/users?source=api" class="filter-tab ${sourceFilter === 'api' ? 'active' : ''}">API (${apiCount})</a>
          </div>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Display Name</th>
                <th>Account Type</th>
                <th>Subscription</th>
                <th>Credits</th>
                <th>Admin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${userRows || '<tr><td colspan="7">No users found</td></tr>'}
            </tbody>
          </table>
        `,
      });

      res.send(html);
    } catch (error) {
      console.error('Users list error:', error);
      res.status(500).send(
        layout({
          title: 'Error',
          content: '<div class="error">Failed to load users</div>',
        })
      );
    }
  });

  // Update user subscription and credits
  router.post('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userRepository } = container.cradle;
      const { id } = req.params;
      const { subscriptionStatus, credits } = req.body;

      console.log(`[Admin UI] Updating user ${id}: subscriptionStatus=${subscriptionStatus}, credits=${credits}`);

      await userRepository.update(id, {
        subscriptionStatus: subscriptionStatus || 'not_subscribed',
        manualSubscriptionOverride: true,
        credits: parseInt(credits) || 0,
        updatedAt: new Date().toISOString(),
      });

      const updated = await userRepository.getById(id);
      console.log(
        `[Admin UI] User ${id} updated. New status: ${(updated as any)?.subscriptionStatus}, manualOverride: ${(updated as any)?.manualSubscriptionOverride}, credits: ${updated?.credits}`
      );

      res.redirect('/admin/users?success=1');
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).send(
        layout({
          title: 'Error',
          content: '<div class="error">Failed to update user</div>',
        })
      );
    }
  });

  // Delete user and all associated data
  router.post('/:id/delete', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userRepository, conversationRepository, messageRepository } = container.cradle;
      const { id } = req.params;

      // Get all conversations for this user
      const userConversations = await conversationRepository.getByUserId(id);

      // Delete all messages for each conversation
      for (const conv of userConversations) {
        const messages = await messageRepository.getByConversationId(conv.id);
        for (const msg of messages) {
          await messageRepository.delete(msg.id);
        }
      }

      // Delete all conversations for this user
      for (const conv of userConversations) {
        await conversationRepository.delete(conv.id);
      }

      // Note: userFeedback table is not covered by current repositories
      // This needs to be documented for follow-up
      const { db } = container.cradle;
      await db.delete(userFeedback).where(eq(userFeedback.userId, id));

      // Delete the user
      await userRepository.delete(id);

      res.redirect('/admin/users?deleted=1');
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).send(
        layout({
          title: 'Error',
          content: '<div class="error">Failed to delete user</div>',
        })
      );
    }
  });

  return router;
}
