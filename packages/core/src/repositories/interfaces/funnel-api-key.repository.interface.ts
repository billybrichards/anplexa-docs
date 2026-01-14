/**
 * Funnel API Key Repository Interface
 *
 * Defines the contract for funnel API key data access operations.
 * Part of the Clean Architecture repository pattern.
 */

import type { FunnelApiKey } from '@anplexa/database';

export interface CreateFunnelApiKeyData {
  id: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  notes?: string | null;
}

export interface IFunnelApiKeyRepository {
  /**
   * Create a new funnel API key
   */
  create(data: CreateFunnelApiKeyData): Promise<FunnelApiKey>;

  /**
   * Get all funnel API keys
   */
  getAll(): Promise<FunnelApiKey[]>;

  /**
   * Get a funnel API key by ID
   */
  getById(id: string): Promise<FunnelApiKey | null>;

  /**
   * Get a funnel API key by its hash
   */
  getByKeyHash(keyHash: string): Promise<FunnelApiKey | null>;

  /**
   * Deactivate a funnel API key (soft delete)
   */
  deactivate(id: string): Promise<void>;

  /**
   * Delete a funnel API key (hard delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Update the last used timestamp
   */
  updateLastUsed(id: string): Promise<void>;
}
