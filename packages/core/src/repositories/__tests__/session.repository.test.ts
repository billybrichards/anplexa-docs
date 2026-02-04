/**
 * Session Repository Unit Tests
 *
 * Comprehensive test suite for SessionRepository implementation.
 * Tests use SQLite in-memory database for isolation and speed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import { sessions } from '@anplexa/database';
import { SessionRepository } from '../session.repository';
import type { CreateSessionData } from '../interfaces/session.repository.interface';

describe('SessionRepository', () => {
  let db: ReturnType<typeof drizzle>;
  let sqliteDb: Database.Database;
  let repository: SessionRepository;

  // Setup: Create in-memory database before each test
  beforeEach(() => {
    sqliteDb = new Database(':memory:');
    db = drizzle(sqliteDb, { schema: { sessions } });

    // Create sessions table
    sqliteDb.exec(`
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    repository = new SessionRepository(db);
  });

  // Teardown: Close database after each test
  afterEach(() => {
    sqliteDb.close();
  });

  describe('create', () => {
    it('should create a new session with valid data', async () => {
      const sessionData: CreateSessionData = {
        userId: 'user-123',
        refreshToken: 'refresh-token-abc',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const session = await repository.create(sessionData);

      expect(session).toBeDefined();
      expect(session.id).toBeTruthy();
      expect(session.userId).toBe(sessionData.userId);
      expect(session.refreshToken).toBe(sessionData.refreshToken);
      // Session entity converts expiresAt to Date object, compare as ISO strings
      expect(session.expiresAt.toISOString()).toBe(sessionData.expiresAt);
      expect(session.createdAt).toBeTruthy();
    });

    it('should generate unique IDs for multiple sessions', async () => {
      const sessionData: CreateSessionData = {
        userId: 'user-123',
        refreshToken: 'token-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const session1 = await repository.create(sessionData);
      const session2 = await repository.create({
        ...sessionData,
        refreshToken: 'token-2',
      });

      expect(session1.id).not.toBe(session2.id);
    });

    it('should set createdAt timestamp automatically', async () => {
      const beforeCreate = new Date();

      const sessionData: CreateSessionData = {
        userId: 'user-123',
        refreshToken: 'refresh-token-abc',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const session = await repository.create(sessionData);
      const afterCreate = new Date();

      expect(session.createdAt).toBeTruthy();
      // Session entity stores createdAt as Date object, compare as timestamps
      expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(session.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should throw error when database insertion fails', async () => {
      // Close the database to simulate a failure
      sqliteDb.close();

      const sessionData: CreateSessionData = {
        userId: 'user-123',
        refreshToken: 'refresh-token-abc',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await expect(repository.create(sessionData)).rejects.toThrow(
        'Failed to create session'
      );
    });
  });

  describe('getByUserId', () => {
    it('should retrieve all sessions for a user', async () => {
      const userId = 'user-123';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Create multiple sessions for the same user
      await repository.create({
        userId,
        refreshToken: 'token-1',
        expiresAt,
      });
      await repository.create({
        userId,
        refreshToken: 'token-2',
        expiresAt,
      });

      const sessions = await repository.getByUserId(userId);

      expect(sessions).toHaveLength(2);
      expect(sessions[0].userId).toBe(userId);
      expect(sessions[1].userId).toBe(userId);
    });

    it('should return empty array when user has no sessions', async () => {
      const sessions = await repository.getByUserId('non-existent-user');

      expect(sessions).toEqual([]);
    });

    it('should only return sessions for the specified user', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await repository.create({
        userId: 'user-1',
        refreshToken: 'token-1',
        expiresAt,
      });
      await repository.create({
        userId: 'user-2',
        refreshToken: 'token-2',
        expiresAt,
      });

      const user1Sessions = await repository.getByUserId('user-1');

      expect(user1Sessions).toHaveLength(1);
      expect(user1Sessions[0].userId).toBe('user-1');
    });

    it('should throw error when database query fails', async () => {
      sqliteDb.close();

      await expect(repository.getByUserId('user-123')).rejects.toThrow(
        'Failed to retrieve sessions for user'
      );
    });
  });

  describe('getByRefreshToken', () => {
    it('should retrieve session by refresh token', async () => {
      const sessionData: CreateSessionData = {
        userId: 'user-123',
        refreshToken: 'unique-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const createdSession = await repository.create(sessionData);
      const foundSession = await repository.getByRefreshToken('unique-refresh-token');

      expect(foundSession).not.toBeNull();
      expect(foundSession!.id).toBe(createdSession.id);
      expect(foundSession!.refreshToken).toBe('unique-refresh-token');
    });

    it('should return null when token does not exist', async () => {
      const session = await repository.getByRefreshToken('non-existent-token');

      expect(session).toBeNull();
    });

    it('should find the correct session among multiple sessions', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await repository.create({
        userId: 'user-1',
        refreshToken: 'token-1',
        expiresAt,
      });
      await repository.create({
        userId: 'user-2',
        refreshToken: 'token-2',
        expiresAt,
      });

      const session = await repository.getByRefreshToken('token-2');

      expect(session).not.toBeNull();
      expect(session!.userId).toBe('user-2');
      expect(session!.refreshToken).toBe('token-2');
    });

    it('should throw error when database query fails', async () => {
      sqliteDb.close();

      await expect(
        repository.getByRefreshToken('some-token')
      ).rejects.toThrow('Failed to retrieve session by refresh token');
    });
  });

  describe('delete', () => {
    it('should delete an existing session', async () => {
      const sessionData: CreateSessionData = {
        userId: 'user-123',
        refreshToken: 'token-to-delete',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const session = await repository.create(sessionData);
      await repository.delete(session.id);

      const foundSession = await repository.getByRefreshToken('token-to-delete');
      expect(foundSession).toBeNull();
    });

    it('should not throw error when deleting non-existent session', async () => {
      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });

    it('should only delete the specified session', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const session1 = await repository.create({
        userId: 'user-1',
        refreshToken: 'token-1',
        expiresAt,
      });
      const session2 = await repository.create({
        userId: 'user-2',
        refreshToken: 'token-2',
        expiresAt,
      });

      await repository.delete(session1.id);

      const foundSession1 = await repository.getByRefreshToken('token-1');
      const foundSession2 = await repository.getByRefreshToken('token-2');

      expect(foundSession1).toBeNull();
      expect(foundSession2).not.toBeNull();
    });

    it('should throw error when database deletion fails', async () => {
      sqliteDb.close();

      await expect(repository.delete('some-id')).rejects.toThrow(
        'Failed to delete session'
      );
    });
  });

  describe('deleteExpired', () => {
    it('should delete all expired sessions', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000).toISOString();
      const future = new Date(now.getTime() + 1000000).toISOString();

      // Create expired sessions
      await repository.create({
        userId: 'user-1',
        refreshToken: 'expired-token-1',
        expiresAt: past,
      });
      await repository.create({
        userId: 'user-2',
        refreshToken: 'expired-token-2',
        expiresAt: past,
      });

      // Create valid session
      await repository.create({
        userId: 'user-3',
        refreshToken: 'valid-token',
        expiresAt: future,
      });

      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(2);

      const expiredSession1 = await repository.getByRefreshToken('expired-token-1');
      const expiredSession2 = await repository.getByRefreshToken('expired-token-2');
      const validSession = await repository.getByRefreshToken('valid-token');

      expect(expiredSession1).toBeNull();
      expect(expiredSession2).toBeNull();
      expect(validSession).not.toBeNull();
    });

    it('should return 0 when no sessions are expired', async () => {
      const future = new Date(Date.now() + 1000000).toISOString();

      await repository.create({
        userId: 'user-1',
        refreshToken: 'token-1',
        expiresAt: future,
      });
      await repository.create({
        userId: 'user-2',
        refreshToken: 'token-2',
        expiresAt: future,
      });

      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(0);

      // Verify sessions still exist
      const user1Sessions = await repository.getByUserId('user-1');
      const user2Sessions = await repository.getByUserId('user-2');

      expect(user1Sessions).toHaveLength(1);
      expect(user2Sessions).toHaveLength(1);
    });

    it('should return 0 when database is empty', async () => {
      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(0);
    });

    it('should handle sessions expiring at exact current time', async () => {
      const exactNow = new Date().toISOString();
      const future = new Date(Date.now() + 1000000).toISOString();

      // Wait a tiny bit to ensure the session is in the past
      await new Promise((resolve) => setTimeout(resolve, 10));

      await repository.create({
        userId: 'user-1',
        refreshToken: 'exact-time-token',
        expiresAt: exactNow,
      });
      await repository.create({
        userId: 'user-2',
        refreshToken: 'future-token',
        expiresAt: future,
      });

      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(1);

      const exactTimeSession = await repository.getByRefreshToken('exact-time-token');
      const futureSession = await repository.getByRefreshToken('future-token');

      expect(exactTimeSession).toBeNull();
      expect(futureSession).not.toBeNull();
    });

    it('should throw error when database deletion fails', async () => {
      sqliteDb.close();

      await expect(repository.deleteExpired()).rejects.toThrow(
        'Failed to delete expired sessions'
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very long refresh tokens', async () => {
      const longToken = 'a'.repeat(1000);
      const sessionData: CreateSessionData = {
        userId: 'user-123',
        refreshToken: longToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const session = await repository.create(sessionData);
      const foundSession = await repository.getByRefreshToken(longToken);

      expect(foundSession).not.toBeNull();
      expect(foundSession!.refreshToken).toBe(longToken);
    });

    it('should handle special characters in user IDs', async () => {
      const specialUserId = 'user-with-special-chars-!@#$%^&*()';
      const sessionData: CreateSessionData = {
        userId: specialUserId,
        refreshToken: 'token-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const session = await repository.create(sessionData);
      const sessions = await repository.getByUserId(specialUserId);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].userId).toBe(specialUserId);
    });

    it('should handle ISO 8601 date formats correctly', async () => {
      const isoDate = '2026-12-31T23:59:59.999Z';
      const sessionData: CreateSessionData = {
        userId: 'user-123',
        refreshToken: 'token-123',
        expiresAt: isoDate,
      };

      const session = await repository.create(sessionData);

      // Session entity converts expiresAt to Date object, compare as ISO strings
      expect(session.expiresAt.toISOString()).toBe(isoDate);
    });

    it('should maintain data integrity across multiple operations', async () => {
      const userId = 'user-123';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Create
      const session1 = await repository.create({
        userId,
        refreshToken: 'token-1',
        expiresAt,
      });

      // Read
      const foundSession = await repository.getByRefreshToken('token-1');
      expect(foundSession!.id).toBe(session1.id);

      // Create another
      const session2 = await repository.create({
        userId,
        refreshToken: 'token-2',
        expiresAt,
      });

      // Read all
      const allSessions = await repository.getByUserId(userId);
      expect(allSessions).toHaveLength(2);

      // Delete one
      await repository.delete(session1.id);

      // Verify
      const remainingSessions = await repository.getByUserId(userId);
      expect(remainingSessions).toHaveLength(1);
      expect(remainingSessions[0].id).toBe(session2.id);
    });
  });
});
