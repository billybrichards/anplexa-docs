/**
 * API Key Repository Implementation
 *
 * Implements the IApiKeyRepository interface using Drizzle ORM.
 * Handles all API key data access operations with proper error handling.
 */

import type { Database } from '@anplexa/database';
import { apiKeys, type ApiKey, eq } from '@anplexa/database';
import type {
  IApiKeyRepository,
  CreateApiKeyData,
} from './interfaces/api-key.repository.interface.js';

export class ApiKeyRepository implements IApiKeyRepository {
  constructor(private readonly db: Database) {}

  /**
   * Create a new API key
   */
  async create(data: CreateApiKeyData): Promise<ApiKey> {
    try {
      // Prepare API key data
      const newApiKey = {
        id: data.id,
        userId: data.userId,
        name: data.name,
        keyHash: data.keyHash,
        keyPrefix: data.keyPrefix,
        isActive: 1 as any, // Use 1 for SQLite compatibility (boolean mode)
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        createdBy: data.userId, // Set createdBy to the userId
      } as any;

      // Insert API key
      await this.db.insert(apiKeys).values(newApiKey);

      // Return the created API key
      const createdKey = await this.getById(data.id);
      if (!createdKey) {
        throw new Error('Failed to retrieve created API key');
      }

      return createdKey;
    } catch (error) {
      throw new Error(`Failed to create API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all API keys
   */
  async getAll(): Promise<ApiKey[]> {
    try {
      return await this.db.select().from(apiKeys);
    } catch (error) {
      throw new Error(`Failed to get all API keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get an API key by ID
   */
  async getById(id: string): Promise<ApiKey | null> {
    try {
      const result = await this.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      throw new Error(`Failed to get API key by id: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all API keys for a specific user
   */
  async getByUserId(userId: string): Promise<ApiKey[]> {
    try {
      return await this.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.userId, userId));
    } catch (error) {
      throw new Error(`Failed to get API keys by user id: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get an API key by its hash
   */
  async getByKeyHash(keyHash: string): Promise<ApiKey | null> {
    try {
      const result = await this.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.keyHash, keyHash))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      throw new Error(`Failed to get API key by hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deactivate an API key (soft delete)
   */
  async deactivate(id: string): Promise<void> {
    try {
      // Check if API key exists
      const existingKey = await this.getById(id);
      if (!existingKey) {
        throw new Error(`API key with id ${id} not found`);
      }

      // Deactivate the key
      await this.db
        .update(apiKeys)
        .set({ isActive: 0 as any }) // Use 0 for SQLite compatibility (boolean mode)
        .where(eq(apiKeys.id, id));
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Failed to deactivate API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an API key (hard delete)
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if API key exists
      const existingKey = await this.getById(id);
      if (!existingKey) {
        throw new Error(`API key with id ${id} not found`);
      }

      // Delete the key
      await this.db.delete(apiKeys).where(eq(apiKeys.id, id));
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Failed to delete API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update the last used timestamp
   */
  async updateLastUsed(id: string): Promise<void> {
    try {
      await this.db
        .update(apiKeys)
        .set({ lastUsedAt: new Date().toISOString() })
        .where(eq(apiKeys.id, id));
    } catch (error) {
      throw new Error(`Failed to update last used timestamp: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
