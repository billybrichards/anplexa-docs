/**
 * API Key Repository Unit Tests
 *
 * Comprehensive test suite for ApiKeyRepository using SQLite in-memory database.
 * Tests all query and command methods with various edge cases.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { apiKeys } from '@anplexa/database/schema/sqlite';
import { ApiKeyRepository } from '../api-key.repository';
import type { CreateApiKeyData } from '../interfaces/api-key.repository.interface';

describe('ApiKeyRepository', () => {
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle>;
  let repository: ApiKeyRepository;

  // Test data
  const baseApiKey: CreateApiKeyData = {
    id: 'key-1',
    userId: 'user-1',
    name: 'Test API Key',
    keyHash: 'hash123',
    keyPrefix: 'ak_test_',
  };

  beforeEach(() => {
    // Create in-memory SQLite database
    sqliteDb = new Database(':memory:');

    // Initialize Drizzle with the SQLite connection and schema
    db = drizzle(sqliteDb, { schema: { apiKeys } });

    // Create the api_keys table
    sqliteDb.exec(
      `CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        key_prefix TEXT NOT NULL,
        user_id TEXT,
        created_by TEXT,
        is_active INTEGER DEFAULT 1,
        last_used_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    );

    // Initialize repository
    repository = new ApiKeyRepository(db);
  });

  afterEach(() => {
    // Close database connection
    sqliteDb.close();
  });

  describe('create', () => {
    it('should create a new API key successfully', async () => {
      const apiKey = await repository.create(baseApiKey);

      expect(apiKey).toBeDefined();
      expect(apiKey.id).toBe(baseApiKey.id);
      expect(apiKey.userId).toBe(baseApiKey.userId);
      expect(apiKey.name).toBe(baseApiKey.name);
      expect(apiKey.keyHash).toBe(baseApiKey.keyHash);
      expect(apiKey.keyPrefix).toBe(baseApiKey.keyPrefix);
      // SQLite stores boolean as INTEGER (1 for true, 0 for false)
      expect(apiKey.isActive).toBeTruthy();
      expect(apiKey.lastUsedAt).toBeNull();
    });

    it('should create multiple API keys for the same user', async () => {
      const key1 = await repository.create({
        ...baseApiKey,
        id: 'key-1',
        name: 'First Key',
      });

      const key2 = await repository.create({
        ...baseApiKey,
        id: 'key-2',
        name: 'Second Key',
      });

      expect(key1.id).toBe('key-1');
      expect(key2.id).toBe('key-2');

      const userKeys = await repository.getByUserId('user-1');
      expect(userKeys).toHaveLength(2);
    });
  });

  describe('getAll', () => {
    it('should return empty array when no API keys exist', async () => {
      const keys = await repository.getAll();
      expect(keys).toHaveLength(0);
    });

    it('should return all created API keys', async () => {
      await repository.create({
        ...baseApiKey,
        id: 'key-1',
      });

      await repository.create({
        ...baseApiKey,
        id: 'key-2',
        userId: 'user-2',
      });

      const keys = await repository.getAll();
      expect(keys).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('should return null for non-existent API key', async () => {
      const key = await repository.getById('non-existent-key');
      expect(key).toBeNull();
    });

    it('should return API key by ID', async () => {
      await repository.create(baseApiKey);

      const key = await repository.getById('key-1');
      expect(key).toBeDefined();
      expect(key?.id).toBe('key-1');
      expect(key?.name).toBe(baseApiKey.name);
    });
  });

  describe('getByUserId', () => {
    it('should return empty array for user with no API keys', async () => {
      const keys = await repository.getByUserId('non-existent-user');
      expect(keys).toHaveLength(0);
    });

    it('should return all API keys for a specific user', async () => {
      await repository.create({
        ...baseApiKey,
        id: 'key-1',
        userId: 'user-1',
      });

      await repository.create({
        ...baseApiKey,
        id: 'key-2',
        userId: 'user-1',
      });

      await repository.create({
        ...baseApiKey,
        id: 'key-3',
        userId: 'user-2',
      });

      const user1Keys = await repository.getByUserId('user-1');
      const user2Keys = await repository.getByUserId('user-2');

      expect(user1Keys).toHaveLength(2);
      expect(user2Keys).toHaveLength(1);
    });
  });

  describe('getByKeyHash', () => {
    it('should return null for non-existent key hash', async () => {
      const key = await repository.getByKeyHash('non-existent-hash');
      expect(key).toBeNull();
    });

    it('should return API key by hash', async () => {
      await repository.create(baseApiKey);

      const key = await repository.getByKeyHash('hash123');
      expect(key).toBeDefined();
      expect(key?.keyHash).toBe('hash123');
      expect(key?.id).toBe('key-1');
    });
  });

  describe('deactivate', () => {
    it('should deactivate an API key', async () => {
      await repository.create(baseApiKey);

      let key = await repository.getById('key-1');
      // SQLite stores boolean as INTEGER (1 for true, 0 for false)
      expect(key?.isActive).toBeTruthy();

      await repository.deactivate('key-1');

      key = await repository.getById('key-1');
      expect(key?.isActive).toBeFalsy();
    });

    it('should throw error when deactivating non-existent key', async () => {
      await expect(repository.deactivate('non-existent-key')).rejects.toThrow(
        'API key with id non-existent-key not found'
      );
    });
  });

  describe('delete', () => {
    it('should delete an API key', async () => {
      await repository.create(baseApiKey);

      let key = await repository.getById('key-1');
      expect(key).toBeDefined();

      await repository.delete('key-1');

      key = await repository.getById('key-1');
      expect(key).toBeNull();
    });

    it('should throw error when deleting non-existent key', async () => {
      await expect(repository.delete('non-existent-key')).rejects.toThrow(
        'API key with id non-existent-key not found'
      );
    });
  });

  describe('updateLastUsed', () => {
    it('should update last used timestamp', async () => {
      await repository.create(baseApiKey);

      let key = await repository.getById('key-1');
      expect(key?.lastUsedAt).toBeNull();

      await repository.updateLastUsed('key-1');

      key = await repository.getById('key-1');
      expect(key?.lastUsedAt).toBeDefined();
      expect(key?.lastUsedAt).not.toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Close the database connection to simulate an error
      sqliteDb.close();

      await expect(repository.getAll()).rejects.toThrow();
    });
  });
});
