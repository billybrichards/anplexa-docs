/**
 * Password Management Routes
 *
 * Handles password reset and recovery endpoints using Clean Architecture.
 * Uses @anplexa/core repositories and use cases.
 */

import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import type { Container } from '../../container.js';
import { ValidationError, AuthenticationError } from '@anplexa/core';
import { sendEmail } from '@anplexa/services';

// Validation schemas
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6),
});

/**
 * Helper for POST-only endpoints - return helpful message for GET requests
 */
const postOnlyHandler = (endpoint: string) => (_req: any, res: any) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    message: `${endpoint} requires a POST request`,
    method: 'POST',
    contentType: 'application/json',
  });
};

/**
 * Create password management routes
 */
export function createPasswordRoutes(container: Container): Router {
  const router = Router();
  const { userRepository, sessionRepository, passwordService } = container.cradle;

  // GET handlers for helpful error messages
  router.get('/forgot-password', postOnlyHandler('/api/auth/forgot-password'));
  router.get('/reset-password', postOnlyHandler('/api/auth/reset-password'));

  // POST /api/auth/forgot-password
  router.post('/forgot-password', async (req, res, next) => {
    try {
      const body = forgotPasswordSchema.parse(req.body);

      // Always return success to prevent email enumeration
      const successMessage = 'If an account exists with this email, a password reset link has been sent';

      // Find user
      const user = await userRepository.getByEmail(body.email);

      if (!user) {
        return res.json({ message: successMessage });
      }

      // Generate secure random token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = await passwordService.hashPassword(token);

      // Set expiry to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // Store token in database using repository
      const { passwordResetTokenRepository } = container.cradle;
      await passwordResetTokenRepository.create({
        userId: user.id,
        token: tokenHash,
        expiresAt,
      });

      // Send password reset email
      const resetLink = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

      await sendEmail({
        to: body.email,
        subject: 'Password Reset Request',
        html: `<p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link will expire in 1 hour.</p>`,
      }).catch(err => {
        console.error('Failed to send password reset email:', err);
      });

      res.json({ message: successMessage });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  });

  // POST /api/auth/reset-password
  router.post('/reset-password', async (req, res, next) => {
    try {
      const body = resetPasswordSchema.parse(req.body);

      // Find all non-expired, unused tokens using repository
      const { passwordResetTokenRepository } = container.cradle;
      const resetTokens = await passwordResetTokenRepository.getAllValid();

      // Find matching token by verifying hash
      let validToken = null;
      for (const resetToken of resetTokens) {
        const isMatch = await passwordService.verifyPassword(body.token, resetToken.token);
        if (isMatch) {
          validToken = resetToken;
          break;
        }
      }

      if (!validToken) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Get user
      const user = await userRepository.getById(validToken.userId);
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      // Hash new password
      const newPasswordHash = await passwordService.hashPassword(body.newPassword);

      // Update user password
      const updatedUser = {
        ...user,
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString(),
      };

      await userRepository.update(updatedUser.id, updatedUser);

      // Mark token as used using repository
      await passwordResetTokenRepository.markAsUsed(validToken.id);

      // Invalidate all user sessions (force re-login)
      const sessions = await sessionRepository.getByUserId(user.id);
      await Promise.all(sessions.map(s => sessionRepository.delete(s.id)));

      res.json({
        success: true,
        message: 'Password reset successfully. Please log in with your new password.'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      if (error instanceof ValidationError) {
        return res.status(400).json({
          error: error.message,
          field: error.field,
        });
      }
      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          error: error.message,
        });
      }
      next(error);
    }
  });

  return router;
}
