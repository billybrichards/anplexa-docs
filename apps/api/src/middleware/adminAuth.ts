/**
 * Admin Authentication Middleware
 */

import { type Request, type Response, type NextFunction } from 'express';
import crypto from 'crypto';

export const ADMIN_PASSWORD = process.env.ADMIN_UI_PASSWORD || 'doomdoom';
export const COOKIE_NAME = 'admin_session';
const SESSION_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

export const activeSessions = new Map<string, { expiresAt: number }>();

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

export function isRateLimited(ip: string): boolean {
  const attempt = loginAttempts.get(ip);
  if (!attempt) return false;
  if (Date.now() - attempt.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(ip);
    return false;
  }
  return attempt.count >= MAX_ATTEMPTS;
}

export function recordLoginAttempt(ip: string, success: boolean) {
  if (success) {
    loginAttempts.delete(ip);
    return;
  }
  const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  attempt.count++;
  attempt.lastAttempt = Date.now();
  loginAttempts.set(ip, attempt);
}

export function generateSessionToken(): string {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac('sha256', SESSION_SECRET)
    .update(randomBytes + timestamp)
    .digest('hex');
  return `${randomBytes}.${timestamp}.${signature}`;
}

export function validateSessionToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [randomBytes, timestamp, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET)
    .update(randomBytes + timestamp)
    .digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return false;
  }
  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

export function isAuthenticated(req: Request): boolean {
  const sessionToken = req.cookies?.[COOKIE_NAME];
  if (!sessionToken || !ADMIN_PASSWORD) return false;
  return validateSessionToken(sessionToken);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthenticated(req)) {
    res.redirect('/admin');
    return;
  }
  next();
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}
