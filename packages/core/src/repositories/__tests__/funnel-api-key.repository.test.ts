/**
 * Funnel API Key Repository Unit Tests
 *
 * Comprehensive test suite for FunnelApiKeyRepository using SQLite in-memory database.
 * Tests all query and command methods with various edge cases.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { funnelApiKeys } from '@anplexa/database/schema/sqlite';
import { FunnelApiKeyRepository } from '../funnel-api-key.repository';
import type { CreateFunnelApiKeyData } from '../interfaces/funnel-api-key.repository.interface';

describe('FunnelApiKeyRepository', () => {
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle>;
  let repository: FunnelApiKeyRepository;

  // Test data
  const baseFunnelApiKey: CreateFunnelApiKeyData = {
    id: 'funnel-key-1',
    name: 'Test Funnel API Key',
    keyHash: 'funnel-hash123',
    keyPrefix: 'fak_test_',
  };

  beforeEach(() => {
    // Create in-memory SQLite database
    sqliteDb = new Database(':memory:');

    // Initialize Drizzle with the SQLite connection and schema
    db = drizzle(sqliteDb, { schema: { funnelApiKeys } });

    // Create the funnel_api_keys table
    sqliteDb.exec(
      `CREATE TABLE IF NOT EXISTS funnel_api_keys (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'Funnel API Key',
        key_hash TEXT NOT NULL,
        key_prefix TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_used_at TEXT,
        notes TEXT
      )`
    );

    // Initialize repository
    repository = new FunnelApiKeyRepository(db);
  });

  afterEach(() => {
    // Close database connection
    sqliteDb.close();
  });

  describe('create', () => {
    it('should create a new funnel API key successfully', async () => {
      const apiKey = await repository.create(baseFunnelApiKey);

      expect(apiKey).toBeDefined();
      expect(apiKey.id).toBe(baseFunnelApiKey.id);
      expect(apiKey.name).toBe(baseFunnelApiKey.name);
      expect(apiKey.keyHash).toBe(baseFunnelApiKey.keyHash);
      expect(apiKey.keyPrefix).toBe(baseFunnelApiKey.keyPrefix);
      // SQLite stores boolean as INTEGER (1 for true, 0 for false)
      expect(apiKey.isActive).toBeTruthy();
      expect(apiKey.lastUsedAt).toBeNull();
    });

    it('should create funnel API key with notes', async () => {
      const keyWithNotes: CreateFunnelApiKeyData = {
        ...baseFunnelApiKey,
        id: 'funnel-key-2',
        notes: 'This key is for production funnel',
      };

      const apiKey = await repository.create(keyWithNotes);

      expect(apiKey).toBeDefined();
      expect(apiKey.notes).toBe('This key is for production funnel');
    });

    it('should create multiple funnel API keys', async () => {
      const key1 = await repository.create({
        ...baseFunnelApiKey,
        id: 'funnel-key-1',
        name: 'First Funnel Key',
      });

      const key2 = await repository.create({
        ...baseFunnelApiKey,
        id: 'funnel-key-2',
        name: 'Second Funnel Key',
      });

      expect(key1.id).toBe('funnel-key-1');
      expect(key2.id).toBe('funnel-key-2');

      const allKeys = await repository.getAll();
      expect(allKeys).toHaveLength(2);
    });
  });

  describe('getAll', () => {
    it('should return empty array when no funnel API keys exist', async () => {
      const keys = await repository.getAll();
      expect(keys).toHaveLength(0);
    });

    it('should return all created funnel API keys', async () => {
      await repository.create({
        ...baseFunnelApiKey,
        id: 'funnel-key-1',
      });

      await repository.create({
        ...baseFunnelApiKey,
        id: 'funnel-key-2',
        name: 'Another Key',
      });

      const keys = await repository.getAll();
      expect(keys).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('should return null for non-existent funnel API key', async () => {
      const key = await repository.getById('non-existent-key');
      expect(key).toBeNull();
    });

    it('should return funnel API key by ID', async () => {
      await repository.create(baseFunnelApiKey);

      const key = await repository.getById('funnel-key-1');
      expect(key).toBeDefined();
      expect(key?.id).toBe('funnel-key-1');
      expect(key?.name).toBe(baseFunnelApiKey.name);
    });
  });

  describe('getByKeyHash', () => {
    it('should return null for non-existent key hash', async () => {
      const key = await repository.getByKeyHash('non-existent-hash');
      expect(key).toBeNull();
    });

    it('should return funnel API key by hash', async () => {
      await repository.create(baseFunnelApiKey);

      const key = await repository.getByKeyHash('funnel-hash123');
      expect(key).toBeDefined();
      expect(key?.keyHash).toBe('funnel-hash123');
      expect(key?.id).toBe('funnel-key-1');
    });
  });

  describe('deactivate', () => {
    it('should deactivate a funnel API key', async () => {
      await repository.create(baseFunnelApiKey);

      let key = await repository.getById('funnel-key-1');
      // SQLite stores boolean as INTEGER (1 for true, 0 for false)
      expect(key?.isActive).toBeTruthy();

      await repository.deactivate('funnel-key-1');

      key = await repository.getById('funnel-key-1');
      expect(key?.isActive).toBeFalsy();
    });

    it('should throw error when deactivating non-existent key', async () => {
      await expect(repository.deactivate('non-existent-key')).rejects.toThrow(
        'Funnel API key with id non-existent-key not found'
      );
    });
  });

  describe('delete', () => {
    it('should delete a funnel API key', async () => {
      await repository.create(baseFunnelApiKey);

      let key = await repository.getById('funnel-key-1');
      expect(key).toBeDefined();

      await repository.delete('funnel-key-1');

      key = await repository.getById('funnel-key-1');
      expect(key).toBeNull();
    });

    it('should throw error when deleting non-existent key', async () => {
      await expect(repository.delete('non-existent-key')).rejects.toThrow(
        'Funnel API key with id non-existent-key not found'
      );
    });
  });

  describe('updateLastUsed', () => {
    it('should update last used timestamp', async () => {
      await repository.create(baseFunnelApiKey);

      let key = await repository.getById('funnel-key-1');
      expect(key?.lastUsedAt).toBeNull();

      await repository.updateLastUsed('funnel-key-1');

      key = await repository.getById('funnel-key-1');
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
