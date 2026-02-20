/**
 * API Usage Repository Unit Tests
 *
 * Comprehensive test suite for ApiUsageRepository using SQLite in-memory database.
 * Tests all query and command methods with various edge cases and statistics calculations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { apiUsage, type ApiUsage } from '@anplexa/database/schema/sqlite';
import { ApiUsageRepository } from '../api-usage.repository.js';
import type { CreateApiUsageData } from '../interfaces/api-usage.repository.interface.js';

// TODO: Fix schema mismatch — repository uses pgTable from @anplexa/database default export
// but test uses SQLite in-memory DB. See packages/database/src/index.ts line 8.
describe.skip('ApiUsageRepository', () => {
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle>;
  let repository: ApiUsageRepository;

  // Test data
  const baseApiUsage: CreateApiUsageData = {
    id: 'usage-1',
    userId: 'user-1',
    endpoint: '/api/chat',
    method: 'POST',
    statusCode: 200,
    tokensUsed: 100,
    latencyMs: 150,
    apiKeyId: 'key-1',
  };

  beforeEach(() => {
    // Create in-memory SQLite database
    sqliteDb = new Database(':memory:');

    // Initialize Drizzle with the SQLite connection and schema
    db = drizzle(sqliteDb, { schema: { apiUsage } });

    // Create the api_usage table
    sqliteDb.exec(
      `CREATE TABLE IF NOT EXISTS api_usage (
        id TEXT PRIMARY KEY,
        api_key_id TEXT,
        user_id TEXT,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        tokens_used INTEGER DEFAULT 0,
        latency_ms INTEGER,
        status_code INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    );

    // Initialize repository
    repository = new ApiUsageRepository(db);
  });

  afterEach(() => {
    // Close database connection
    sqliteDb.close();
  });

  describe('create', () => {
    it('should create a new API usage record successfully', async () => {
      const record = await repository.create(baseApiUsage);

      expect(record).toBeDefined();
      expect(record.id).toBe(baseApiUsage.id);
      expect(record.userId).toBe(baseApiUsage.userId);
      expect(record.endpoint).toBe(baseApiUsage.endpoint);
      expect(record.method).toBe(baseApiUsage.method);
      expect(record.statusCode).toBe(200);
      expect(record.tokensUsed).toBe(100);
      expect(record.latencyMs).toBe(150);
    });

    it('should create a record with minimal required fields', async () => {
      const minimalUsage: CreateApiUsageData = {
        id: 'usage-2',
        userId: 'user-2',
        endpoint: '/api/messages',
        method: 'GET',
        statusCode: 200,
      };

      const record = await repository.create(minimalUsage);

      expect(record).toBeDefined();
      expect(record.id).toBe(minimalUsage.id);
      expect(record.tokensUsed).toBe(0);
      expect(record.latencyMs).toBeNull();
      expect(record.apiKeyId).toBeNull();
    });

    it('should create multiple usage records for the same user', async () => {
      const usage1 = await repository.create({
        ...baseApiUsage,
        id: 'usage-1',
      });

      const usage2 = await repository.create({
        ...baseApiUsage,
        id: 'usage-2',
        endpoint: '/api/feedback',
      });

      expect(usage1.id).toBe('usage-1');
      expect(usage2.id).toBe('usage-2');

      const userRecords = await repository.getByUserId('user-1');
      expect(userRecords).toHaveLength(2);
    });

    it('should record different HTTP status codes', async () => {
      const success = await repository.create({
        ...baseApiUsage,
        id: 'usage-success',
        statusCode: 200,
      });

      const clientError = await repository.create({
        ...baseApiUsage,
        id: 'usage-client-error',
        statusCode: 400,
      });

      const serverError = await repository.create({
        ...baseApiUsage,
        id: 'usage-server-error',
        statusCode: 500,
      });

      expect(success.statusCode).toBe(200);
      expect(clientError.statusCode).toBe(400);
      expect(serverError.statusCode).toBe(500);
    });
  });

  describe('getAll', () => {
    it('should return empty array when no records exist', async () => {
      const records = await repository.getAll();
      expect(records).toHaveLength(0);
    });

    it('should return all created records', async () => {
      await repository.create({
        ...baseApiUsage,
        id: 'usage-1',
      });

      await repository.create({
        ...baseApiUsage,
        id: 'usage-2',
        userId: 'user-2',
      });

      const records = await repository.getAll();
      expect(records).toHaveLength(2);
    });
  });

  describe('getByUserId', () => {
    it('should return empty array for non-existent user', async () => {
      const records = await repository.getByUserId('non-existent-user');
      expect(records).toHaveLength(0);
    });

    it('should return records for a specific user', async () => {
      await repository.create({
        ...baseApiUsage,
        id: 'usage-1',
        userId: 'user-1',
      });

      await repository.create({
        ...baseApiUsage,
        id: 'usage-2',
        userId: 'user-1',
      });

      await repository.create({
        ...baseApiUsage,
        id: 'usage-3',
        userId: 'user-2',
      });

      const user1Records = await repository.getByUserId('user-1');
      const user2Records = await repository.getByUserId('user-2');

      expect(user1Records).toHaveLength(2);
      expect(user2Records).toHaveLength(1);
    });
  });

  describe('getByDateRange', () => {
    it('should return records within date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

      await repository.create({
        ...baseApiUsage,
        id: 'usage-1',
      });

      const records = await repository.getByDateRange(yesterday, tomorrow);
      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for date range with no records', async () => {
      const pastStart = '2020-01-01T00:00:00Z';
      const pastEnd = '2020-01-31T23:59:59Z';

      const records = await repository.getByDateRange(pastStart, pastEnd);
      expect(records).toHaveLength(0);
    });
  });

  describe('getByEndpoint', () => {
    it('should return records for a specific endpoint', async () => {
      await repository.create({
        ...baseApiUsage,
        id: 'usage-1',
        endpoint: '/api/chat',
      });

      await repository.create({
        ...baseApiUsage,
        id: 'usage-2',
        endpoint: '/api/feedback',
      });

      const chatRecords = await repository.getByEndpoint('/api/chat');
      const feedbackRecords = await repository.getByEndpoint('/api/feedback');

      expect(chatRecords).toHaveLength(1);
      expect(feedbackRecords).toHaveLength(1);
    });
  });

  describe('getUsageStats', () => {
    it('should return zero stats when no records exist', async () => {
      const stats = await repository.getUsageStats();

      expect(stats.totalRequests).toBe(0);
      expect(stats.uniqueUsers).toBe(0);
      expect(stats.avgRequestsPerUser).toBe(0);
      expect(stats.successRate).toBe(0);
    });

    it('should calculate total requests and unique users', async () => {
      await repository.create({
        ...baseApiUsage,
        id: 'usage-1',
        userId: 'user-1',
      });

      await repository.create({
        ...baseApiUsage,
        id: 'usage-2',
        userId: 'user-1',
      });

      await repository.create({
        ...baseApiUsage,
        id: 'usage-3',
        userId: 'user-2',
      });

      const stats = await repository.getUsageStats();

      expect(stats.totalRequests).toBe(3);
      expect(stats.uniqueUsers).toBe(2);
      expect(stats.avgRequestsPerUser).toBe(2); // 3 / 2 = 1.5, rounded to 2
    });

    it('should calculate success rate correctly', async () => {
      // Create 3 successful requests (2xx status)
      await repository.create({
        ...baseApiUsage,
        id: 'usage-1',
        statusCode: 200,
      });

      await repository.create({
        ...baseApiUsage,
        id: 'usage-2',
        statusCode: 201,
      });

      // Create 1 failed request (4xx status)
      await repository.create({
        ...baseApiUsage,
        id: 'usage-3',
        statusCode: 404,
      });

      const stats = await repository.getUsageStats();

      // 2 successful out of 3 total = 66.67% success rate, rounded to 67
      expect(stats.successRate).toBe(67);
    });

    it('should calculate average latency', async () => {
      await repository.create({
        ...baseApiUsage,
        id: 'usage-1',
        latencyMs: 100,
      });

      await repository.create({
        ...baseApiUsage,
        id: 'usage-2',
        latencyMs: 200,
      });

      const stats = await repository.getUsageStats();

      expect(stats.avgLatencyMs).toBe(150); // (100 + 200) / 2
    });
  });

  describe('getUserStats', () => {
    it('should return zero stats for non-existent user', async () => {
      const stats = await repository.getUserStats('non-existent-user');

      expect(stats.totalRequests).toBe(0);
      expect(stats.uniqueUsers).toBe(0);
      expect(stats.avgRequestsPerUser).toBe(0);
      expect(stats.successRate).toBe(0);
    });

    it('should calculate user-specific statistics', async () => {
      const userId = 'user-1';

      // Create requests for user-1
      await repository.create({
        ...baseApiUsage,
        id: 'usage-1',
        userId,
        statusCode: 200,
        latencyMs: 100,
      });

      await repository.create({
        ...baseApiUsage,
        id: 'usage-2',
        userId,
        statusCode: 200,
        latencyMs: 200,
      });

      // Create request for user-2 (should not be included)
      await repository.create({
        ...baseApiUsage,
        id: 'usage-3',
        userId: 'user-2',
      });

      const stats = await repository.getUserStats(userId);

      expect(stats.totalRequests).toBe(2);
      expect(stats.uniqueUsers).toBe(1);
      expect(stats.avgRequestsPerUser).toBe(2);
      expect(stats.successRate).toBe(100);
      expect(stats.avgLatencyMs).toBe(150);
    });
  });

  describe('getStatsByDateRange', () => {
    it('should return zero stats for empty date range', async () => {
      const stats = await repository.getStatsByDateRange(
        '2020-01-01T00:00:00Z',
        '2020-01-31T23:59:59Z'
      );

      expect(stats.totalRequests).toBe(0);
      expect(stats.uniqueUsers).toBe(0);
    });

    it('should calculate statistics for date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

      await repository.create({
        ...baseApiUsage,
        id: 'usage-1',
        userId: 'user-1',
        statusCode: 200,
      });

      await repository.create({
        ...baseApiUsage,
        id: 'usage-2',
        userId: 'user-2',
        statusCode: 200,
      });

      const stats = await repository.getStatsByDateRange(yesterday, tomorrow);

      expect(stats.totalRequests).toBeGreaterThanOrEqual(2);
      expect(stats.uniqueUsers).toBeGreaterThanOrEqual(2);
      expect(stats.successRate).toBeGreaterThan(0);
    });
  });

  describe('deleteOlderThan', () => {
    it('should handle delete operation', async () => {
      await repository.create({
        ...baseApiUsage,
        id: 'usage-1',
      });

      // Just test that the method executes without error
      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      const result = await repository.deleteOlderThan(futureDate);

      expect(typeof result).toBe('number');
    });
  });

  describe('error handling', () => {
    it('should handle invalid date formats', async () => {
      await expect(repository.getByDateRange('invalid-date', '2020-12-31')).rejects.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      // Close the database connection to simulate an error
      sqliteDb.close();

      await expect(repository.getAll()).rejects.toThrow();
    });
  });
});
