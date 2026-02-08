/**
 * API Key Repository Interface
 *
 * Defines the contract for API key data access operations.
 * Part of the Clean Architecture repository pattern.
 */

import type { ApiKey } from '@anplexa/database';

export interface CreateApiKeyData {
  id: string;
  userId?: string | null;
  name: string;
  keyHash: string;
  keyPrefix: string;
}

export interface IApiKeyRepository {
  /**
   * Create a new API key
   */
  create(data: CreateApiKeyData): Promise<ApiKey>;

  /**
   * Get all API keys
   */
  getAll(): Promise<ApiKey[]>;

  /**
   * Get an API key by ID
   */
  getById(id: string): Promise<ApiKey | null>;

  /**
   * Get all API keys for a specific user
   */
  getByUserId(userId: string): Promise<ApiKey[]>;

  /**
   * Get an API key by its hash
   */
  getByKeyHash(keyHash: string): Promise<ApiKey | null>;

  /**
   * Deactivate an API key (soft delete)
   */
  deactivate(id: string): Promise<void>;

  /**
   * Delete an API key (hard delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Update the last used timestamp
   */
  updateLastUsed(id: string): Promise<void>;
}
