/**
 * Email Verification Routes
 *
 * Handles sending verification codes and verifying email addresses.
 * Uses a 6-digit code approach for inline onboarding verification.
 */

import { Router } from 'express';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import type { Container } from '../../container.js';
import { postgres as schema } from '@anplexa/database';
import { sendTemplateEmail, emailVerificationCodeEmail } from '@anplexa/services';

const sendVerificationSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
});

const verifyCodeSchema = z.object({
  userId: z.string().min(1),
  code: z.string().length(6),
});

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function createVerifyEmailRoutes(container: Container): Router {
  const router = Router();

  // POST /api/auth/send-verification
  router.post('/send-verification', async (req, res, next) => {
    try {
      const { userId, email } = sendVerificationSchema.parse(req.body);
      const db = container.cradle.db;
      const jwtService = container.cradle.jwtService;

      const code = generateCode();
      const codeH = hashCode(code);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Delete any existing verification tokens for this user
      await db.delete(schema.emailVerificationTokens)
        .where(eq(schema.emailVerificationTokens.userId, userId));

      // Insert new token
      await db.insert(schema.emailVerificationTokens).values({
        id: jwtService.generateId(),
        userId,
        codeHash: codeH,
        expiresAt,
      });

      // Send email (don't expose delivery failures to prevent email enumeration)
      const result = await sendTemplateEmail(email, emailVerificationCodeEmail(code));
      if (!result.success) {
        console.error('[verify-email] Failed to send verification email to:', email);
      }

      res.json({ message: 'Verification code sent' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  });

  // POST /api/auth/verify-email
  router.post('/verify-email', async (req, res, next) => {
    try {
      const { userId, code } = verifyCodeSchema.parse(req.body);
      const db = container.cradle.db;
      const codeH = hashCode(code);

      // Find valid token
      const tokens = await db
        .select()
        .from(schema.emailVerificationTokens)
        .where(
          and(
            eq(schema.emailVerificationTokens.userId, userId),
            eq(schema.emailVerificationTokens.codeHash, codeH),
          )
        );

      const token = tokens[0];

      if (!token) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      if (token.usedAt) {
        return res.status(400).json({ error: 'Code already used' });
      }

      if (new Date(token.expiresAt) < new Date()) {
        return res.status(400).json({ error: 'Verification code expired' });
      }

      // Mark token as used
      await db.update(schema.emailVerificationTokens)
        .set({ usedAt: new Date().toISOString() })
        .where(eq(schema.emailVerificationTokens.id, token.id));

      // Mark user as verified
      await db.update(schema.users)
        .set({ isVerified: true })
        .where(eq(schema.users.id, userId));

      res.json({ message: 'Email verified successfully', verified: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  });

  return router;
}
