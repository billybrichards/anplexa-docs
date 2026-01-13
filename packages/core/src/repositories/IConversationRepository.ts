/**
 * Conversation Repository Interface
 *
 * Defines the contract for conversation persistence operations.
 * Implemented by infrastructure layer (e.g., DrizzleConversationRepository)
 */

import type { Conversation } from '../domain/entities/Conversation';

export interface IConversationRepository {
  /**
   * Find a conversation by ID
   * @param id - Conversation ID
   * @returns Conversation entity or null if not found
   */
  findById(id: string): Promise<Conversation | null>;

  /**
   * Find all conversations for a user
   * @param userId - User ID
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Array of conversation entities
   */
  findByUserId(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<Conversation[]>;

  /**
   * Save a conversation (create or update)
   * @param conversation - Conversation entity to persist
   * @returns Persisted conversation entity
   */
  save(conversation: Conversation): Promise<Conversation>;

  /**
   * Delete a conversation by ID
   * @param id - Conversation ID
   */
  delete(id: string): Promise<void>;

  /**
   * Get conversation count for a user
   * @param userId - User ID
   * @returns Total number of conversations
   */
  countByUserId(userId: string): Promise<number>;
}
