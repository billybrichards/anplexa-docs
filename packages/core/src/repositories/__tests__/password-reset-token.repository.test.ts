/**
 * Password Reset Token Repository Unit Tests
 *
 * Comprehensive test suite for PasswordResetTokenRepository implementation.
 * Tests use SQLite in-memory database for isolation and speed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { PasswordResetTokenRepository } from '../password-reset-token.repository.js';
import type { CreatePasswordResetTokenData } from '../interfaces/password-reset-token.repository.interface.js';

describe('PasswordResetTokenRepository', () => {
  let db: ReturnType<typeof drizzle>;
  let sqliteDb: Database.Database;
  let repository: PasswordResetTokenRepository;

  // Setup: Create in-memory database before each test
  beforeEach(() => {
    sqliteDb = new Database(':memory:');
    db = drizzle(sqliteDb);

    // Create password_reset_tokens table matching postgres schema
    sqliteDb.exec(`
      CREATE TABLE password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    repository = new PasswordResetTokenRepository(db);
  });

  // Teardown: Close database after each test
  afterEach(() => {
    sqliteDb.close();
  });

  describe('create', () => {
    it('should create a new password reset token with valid data', async () => {
      const tokenData: CreatePasswordResetTokenData = {
        userId: 'user-123',
        token: 'hashed-token-abc',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      const token = await repository.create(tokenData);

      expect(token).toBeDefined();
      expect(token.id).toBeTruthy();
      expect(token.userId).toBe(tokenData.userId);
      expect(token.token).toBe(tokenData.token);
      expect(token.used).toBe(false);
      expect(token.expiresAt).toBeInstanceOf(Date);
      expect(token.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs for multiple tokens', async () => {
      const tokenData: CreatePasswordResetTokenData = {
        userId: 'user-123',
        token: 'token-hash-1',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      const token1 = await repository.create(tokenData);
      const token2 = await repository.create({
        ...tokenData,
        token: 'token-hash-2',
      });

      expect(token1.id).not.toBe(token2.id);
    });

    it('should set createdAt timestamp automatically', async () => {
      const beforeCreate = Date.now();

      const tokenData: CreatePasswordResetTokenData = {
        userId: 'user-123',
        token: 'hashed-token-abc',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      const token = await repository.create(tokenData);
      const afterCreate = Date.now();

      expect(token.createdAt).toBeTruthy();
      expect(token.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate);
      expect(token.createdAt.getTime()).toBeLessThanOrEqual(afterCreate);
    });

    it('should initialize used as false', async () => {
      const tokenData: CreatePasswordResetTokenData = {
        userId: 'user-123',
        token: 'hashed-token-abc',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      const token = await repository.create(tokenData);

      expect(token.used).toBe(false);
    });

    it('should throw error when database insertion fails', async () => {
      // Close the database to simulate a failure
      sqliteDb.close();

      const tokenData: CreatePasswordResetTokenData = {
        userId: 'user-123',
        token: 'hashed-token-abc',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      await expect(repository.create(tokenData)).rejects.toThrow(
        'Failed to create password reset token'
      );
    });

    it('should allow multiple tokens for the same user', async () => {
      const userId = 'user-123';
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const token1 = await repository.create({
        userId,
        token: 'hash-1',
        expiresAt,
      });

      const token2 = await repository.create({
        userId,
        token: 'hash-2',
        expiresAt,
      });

      expect(token1.id).not.toBe(token2.id);
      expect(token1.userId).toBe(userId);
      expect(token2.userId).toBe(userId);
    });
  });

  describe('getByToken', () => {
    it('should retrieve token by token hash', async () => {
      const tokenData: CreatePasswordResetTokenData = {
        userId: 'user-123',
        token: 'unique-token-hash',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      const createdToken = await repository.create(tokenData);
      const foundToken = await repository.getByToken('unique-token-hash');

      expect(foundToken).not.toBeNull();
      expect(foundToken!.id).toBe(createdToken.id);
      expect(foundToken!.token).toBe('unique-token-hash');
      expect(foundToken!.userId).toBe('user-123');
    });

    it('should return null when token does not exist', async () => {
      const token = await repository.getByToken('non-existent-token');

      expect(token).toBeNull();
    });

    it('should find the correct token among multiple tokens', async () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await repository.create({
        userId: 'user-1',
        token: 'token-hash-1',
        expiresAt,
      });

      await repository.create({
        userId: 'user-2',
        token: 'token-hash-2',
        expiresAt,
      });

      const token = await repository.getByToken('token-hash-2');

      expect(token).not.toBeNull();
      expect(token!.userId).toBe('user-2');
      expect(token!.token).toBe('token-hash-2');
    });

    it('should properly convert database dates to Date objects', async () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await repository.create({
        userId: 'user-123',
        token: 'token-hash',
        expiresAt,
      });

      const token = await repository.getByToken('token-hash');

      expect(token).not.toBeNull();
      expect(token!.expiresAt).toBeInstanceOf(Date);
      expect(token!.createdAt).toBeInstanceOf(Date);
      expect(token!.expiresAt.toISOString()).toBe(expiresAt);
    });

    it('should throw error when database query fails', async () => {
      sqliteDb.close();

      await expect(
        repository.getByToken('some-token')
      ).rejects.toThrow('Failed to retrieve password reset token');
    });
  });

  describe('markAsUsed', () => {
    it('should mark a token as used', async () => {
      const tokenData: CreatePasswordResetTokenData = {
        userId: 'user-123',
        token: 'token-to-use',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      const createdToken = await repository.create(tokenData);

      // Verify initially not used
      expect(createdToken.used).toBe(false);

      // Mark as used
      await repository.markAsUsed(createdToken.id);

      // Verify it's marked as used
      const updatedToken = await repository.getByToken('token-to-use');
      expect(updatedToken).not.toBeNull();
      expect(updatedToken!.used).toBe(true);
    });

    it('should not affect other tokens when marking one as used', async () => {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const token1 = await repository.create({
        userId: 'user-1',
        token: 'token-1',
        expiresAt,
      });

      const token2 = await repository.create({
        userId: 'user-2',
        token: 'token-2',
        expiresAt,
      });

      // Mark only token1 as used
      await repository.markAsUsed(token1.id);

      const foundToken1 = await repository.getByToken('token-1');
      const foundToken2 = await repository.getByToken('token-2');

      expect(foundToken1!.used).toBe(true);
      expect(foundToken2!.used).toBe(false);
    });

    it('should not throw error when marking non-existent token', async () => {
      // This should complete without throwing
      await expect(
        repository.markAsUsed('non-existent-id')
      ).resolves.not.toThrow();
    });

    it('should be idempotent - marking already used token as used again', async () => {
      const tokenData: CreatePasswordResetTokenData = {
        userId: 'user-123',
        token: 'token-hash',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      const token = await repository.create(tokenData);

      // Mark as used twice
      await repository.markAsUsed(token.id);
      await repository.markAsUsed(token.id);

      const foundToken = await repository.getByToken('token-hash');
      expect(foundToken!.used).toBe(true);
    });

    it('should throw error when database update fails', async () => {
      const tokenData: CreatePasswordResetTokenData = {
        userId: 'user-123',
        token: 'token-hash',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      const token = await repository.create(tokenData);

      sqliteDb.close();

      await expect(repository.markAsUsed(token.id)).rejects.toThrow(
        'Failed to mark password reset token as used'
      );
    });
  });

  describe('deleteExpired', () => {
    it('should delete all expired tokens', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000).toISOString();
      const future = new Date(now.getTime() + 1000000).toISOString();

      // Create expired tokens
      await repository.create({
        userId: 'user-1',
        token: 'expired-token-1',
        expiresAt: past,
      });

      await repository.create({
        userId: 'user-2',
        token: 'expired-token-2',
        expiresAt: past,
      });

      // Create valid token
      await repository.create({
        userId: 'user-3',
        token: 'valid-token',
        expiresAt: future,
      });

      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(2);

      const expiredToken1 = await repository.getByToken('expired-token-1');
      const expiredToken2 = await repository.getByToken('expired-token-2');
      const validToken = await repository.getByToken('valid-token');

      expect(expiredToken1).toBeNull();
      expect(expiredToken2).toBeNull();
      expect(validToken).not.toBeNull();
    });

    it('should return 0 when no tokens are expired', async () => {
      const future = new Date(Date.now() + 1000000).toISOString();

      await repository.create({
        userId: 'user-1',
        token: 'token-1',
        expiresAt: future,
      });

      await repository.create({
        userId: 'user-2',
        token: 'token-2',
        expiresAt: future,
      });

      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(0);

      // Verify tokens still exist
      const token1 = await repository.getByToken('token-1');
      const token2 = await repository.getByToken('token-2');

      expect(token1).not.toBeNull();
      expect(token2).not.toBeNull();
    });

    it('should return 0 when database is empty', async () => {
      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(0);
    });

    it('should delete expired tokens regardless of used status', async () => {
      const past = new Date(Date.now() - 1000).toISOString();

      const unusedToken = await repository.create({
        userId: 'user-1',
        token: 'expired-unused',
        expiresAt: past,
      });

      const usedToken = await repository.create({
        userId: 'user-2',
        token: 'expired-used',
        expiresAt: past,
      });

      // Mark one as used
      await repository.markAsUsed(usedToken.id);

      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(2);

      const foundUnused = await repository.getByToken('expired-unused');
      const foundUsed = await repository.getByToken('expired-used');

      expect(foundUnused).toBeNull();
      expect(foundUsed).toBeNull();
    });

    it('should handle tokens expiring at exact current time', async () => {
      const exactNow = new Date().toISOString();
      const future = new Date(Date.now() + 1000000).toISOString();

      // Wait a tiny bit to ensure the token is in the past
      await new Promise((resolve) => setTimeout(resolve, 10));

      await repository.create({
        userId: 'user-1',
        token: 'exact-time-token',
        expiresAt: exactNow,
      });

      await repository.create({
        userId: 'user-2',
        token: 'future-token',
        expiresAt: future,
      });

      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(1);

      const exactTimeToken = await repository.getByToken('exact-time-token');
      const futureToken = await repository.getByToken('future-token');

      expect(exactTimeToken).toBeNull();
      expect(futureToken).not.toBeNull();
    });

    it('should throw error when database deletion fails', async () => {
      sqliteDb.close();

      await expect(repository.deleteExpired()).rejects.toThrow(
        'Failed to delete expired password reset tokens'
      );
    });
  });

  describe('PasswordResetToken entity methods', () => {
    it('should correctly identify expired tokens', async () => {
      const past = new Date(Date.now() - 1000).toISOString();
      const future = new Date(Date.now() + 1000000).toISOString();

      const expiredToken = await repository.create({
        userId: 'user-1',
        token: 'expired',
        expiresAt: past,
      });

      const validToken = await repository.create({
        userId: 'user-2',
        token: 'valid',
        expiresAt: future,
      });

      expect(expiredToken.isExpired()).toBe(true);
      expect(validToken.isExpired()).toBe(false);
    });

    it('should correctly identify valid tokens', async () => {
      const future = new Date(Date.now() + 1000000).toISOString();

      const token = await repository.create({
        userId: 'user-1',
        token: 'token-hash',
        expiresAt: future,
      });

      // Not used and not expired = valid
      expect(token.isValid()).toBe(true);

      // Mark as used
      await repository.markAsUsed(token.id);
      const usedToken = await repository.getByToken('token-hash');

      // Used = not valid
      expect(usedToken!.isValid()).toBe(false);
    });

    it('should identify invalid token when expired', async () => {
      const past = new Date(Date.now() - 1000).toISOString();

      const token = await repository.create({
        userId: 'user-1',
        token: 'token-hash',
        expiresAt: past,
      });

      // Expired = not valid, even if not used
      expect(token.isValid()).toBe(false);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very long token hashes', async () => {
      const longHash = 'a'.repeat(1000);
      const tokenData: CreatePasswordResetTokenData = {
        userId: 'user-123',
        token: longHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      const token = await repository.create(tokenData);
      const foundToken = await repository.getByToken(longHash);

      expect(foundToken).not.toBeNull();
      expect(foundToken!.token).toBe(longHash);
    });

    it('should handle special characters in user IDs', async () => {
      const specialUserId = 'user-with-special-chars-!@#$%^&*()';
      const tokenData: CreatePasswordResetTokenData = {
        userId: specialUserId,
        token: 'token-123',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      const token = await repository.create(tokenData);

      expect(token.userId).toBe(specialUserId);
    });

    it('should handle ISO 8601 date formats correctly', async () => {
      const isoDate = '2026-12-31T23:59:59.999Z';
      const tokenData: CreatePasswordResetTokenData = {
        userId: 'user-123',
        token: 'token-123',
        expiresAt: isoDate,
      };

      const token = await repository.create(tokenData);

      expect(token.expiresAt.toISOString()).toBe(isoDate);
    });

    it('should maintain data integrity across multiple operations', async () => {
      const userId = 'user-123';
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // Create
      const token = await repository.create({
        userId,
        token: 'token-hash',
        expiresAt,
      });

      // Read
      const foundToken = await repository.getByToken('token-hash');
      expect(foundToken!.id).toBe(token.id);
      expect(foundToken!.used).toBe(false);

      // Mark as used
      await repository.markAsUsed(token.id);

      // Verify used status
      const usedToken = await repository.getByToken('token-hash');
      expect(usedToken!.used).toBe(true);

      // Clean up expired (shouldn't affect this token)
      const deletedCount = await repository.deleteExpired();
      expect(deletedCount).toBe(0);

      // Verify token still exists
      const stillThere = await repository.getByToken('token-hash');
      expect(stillThere).not.toBeNull();
    });

    it('should handle concurrent token creation for same user', async () => {
      const userId = 'user-123';
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // Create multiple tokens concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        repository.create({
          userId,
          token: `token-${i}`,
          expiresAt,
        })
      );

      const tokens = await Promise.all(promises);

      // All should have unique IDs
      const ids = tokens.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);

      // All should be for the same user
      tokens.forEach((token) => {
        expect(token.userId).toBe(userId);
      });
    });
  });
});
