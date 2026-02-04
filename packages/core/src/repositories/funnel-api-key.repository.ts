/**
 * Funnel API Key Repository Implementation
 *
 * Implements the IFunnelApiKeyRepository interface using Drizzle ORM.
 * Handles all funnel API key data access operations with proper error handling.
 */

import type { Database } from '@anplexa/database';
import { funnelApiKeys, type FunnelApiKey, eq } from '@anplexa/database';
import type {
  IFunnelApiKeyRepository,
  CreateFunnelApiKeyData,
} from './interfaces/funnel-api-key.repository.interface';

export class FunnelApiKeyRepository implements IFunnelApiKeyRepository {
  constructor(private readonly db: Database) {}

  /**
   * Create a new funnel API key
   */
  async create(data: CreateFunnelApiKeyData): Promise<FunnelApiKey> {
    try {
      // Prepare funnel API key data
      const newFunnelApiKey = {
        id: data.id,
        name: data.name,
        keyHash: data.keyHash,
        keyPrefix: data.keyPrefix,
        isActive: 1 as any, // Use 1 for SQLite compatibility (boolean mode)
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        notes: data.notes ?? null,
      } as any;

      // Insert funnel API key
      await this.db.insert(funnelApiKeys).values(newFunnelApiKey);

      // Return the created funnel API key
      const createdKey = await this.getById(data.id);
      if (!createdKey) {
        throw new Error('Failed to retrieve created funnel API key');
      }

      return createdKey;
    } catch (error) {
      throw new Error(`Failed to create funnel API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all funnel API keys
   */
  async getAll(): Promise<FunnelApiKey[]> {
    try {
      return await this.db.select().from(funnelApiKeys);
    } catch (error) {
      throw new Error(`Failed to get all funnel API keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a funnel API key by ID
   */
  async getById(id: string): Promise<FunnelApiKey | null> {
    try {
      const result = await this.db
        .select()
        .from(funnelApiKeys)
        .where(eq(funnelApiKeys.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      throw new Error(`Failed to get funnel API key by id: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a funnel API key by its hash
   */
  async getByKeyHash(keyHash: string): Promise<FunnelApiKey | null> {
    try {
      const result = await this.db
        .select()
        .from(funnelApiKeys)
        .where(eq(funnelApiKeys.keyHash, keyHash))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      throw new Error(`Failed to get funnel API key by hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deactivate a funnel API key (soft delete)
   */
  async deactivate(id: string): Promise<void> {
    try {
      // Check if funnel API key exists
      const existingKey = await this.getById(id);
      if (!existingKey) {
        throw new Error(`Funnel API key with id ${id} not found`);
      }

      // Deactivate the key
      await this.db
        .update(funnelApiKeys)
        .set({ isActive: 0 as any }) // Use 0 for SQLite compatibility (boolean mode)
        .where(eq(funnelApiKeys.id, id));
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Failed to deactivate funnel API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Activate a funnel API key
   */
  async activate(id: string): Promise<void> {
    try {
      // Check if funnel API key exists
      const existingKey = await this.getById(id);
      if (!existingKey) {
        throw new Error(`Funnel API key with id ${id} not found`);
      }

      // Activate the key
      await this.db
        .update(funnelApiKeys)
        .set({ isActive: 1 as any }) // Use 1 for SQLite compatibility (boolean mode)
        .where(eq(funnelApiKeys.id, id));
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Failed to activate funnel API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a funnel API key (hard delete)
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if funnel API key exists
      const existingKey = await this.getById(id);
      if (!existingKey) {
        throw new Error(`Funnel API key with id ${id} not found`);
      }

      // Delete the key
      await this.db.delete(funnelApiKeys).where(eq(funnelApiKeys.id, id));
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Failed to delete funnel API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update the last used timestamp
   */
  async updateLastUsed(id: string): Promise<void> {
    try {
      await this.db
        .update(funnelApiKeys)
        .set({ lastUsedAt: new Date().toISOString() })
        .where(eq(funnelApiKeys.id, id));
    } catch (error) {
      throw new Error(`Failed to update last used timestamp: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
