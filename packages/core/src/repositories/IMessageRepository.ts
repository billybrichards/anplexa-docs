/**
 * Message Repository Interface
 *
 * Defines the contract for message persistence operations.
 * Implemented by infrastructure layer (e.g., DrizzleMessageRepository)
 */

import type { Message } from '../domain/entities/Message';

export interface IMessageRepository {
  /**
   * Find a message by ID
   * @param id - Message ID
   * @returns Message entity or null if not found
   */
  findById(id: string): Promise<Message | null>;

  /**
   * Find all messages for a conversation
   * @param conversationId - Conversation ID
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Array of message entities
   */
  findByConversationId(
    conversationId: string,
    limit?: number,
    offset?: number
  ): Promise<Message[]>;

  /**
   * Save a message (create or update)
   * @param message - Message entity to persist
   * @returns Persisted message entity
   */
  save(message: Message): Promise<Message>;

  /**
   * Delete a message by ID
   * @param id - Message ID
   */
  delete(id: string): Promise<void>;

  /**
   * Get message count for a conversation
   * @param conversationId - Conversation ID
   * @returns Total number of messages
   */
  countByConversationId(conversationId: string): Promise<number>;
}
