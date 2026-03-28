/**
 * Message Repository Interface
 *
 * Defines the contract for message data access operations.
 * Implementations should handle database operations for message entities.
 */

import type { MessageDTO } from '@anplexa/contracts';

/**
 * Pagination options for querying messages
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Data required to create a new message
 */
export interface CreateMessageData {
  id?: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Message Repository Interface
 *
 * Provides methods for querying and manipulating message data.
 */
export interface IMessageRepository {
  /**
   * Get messages by conversation ID
   * @param conversationId - The conversation ID to fetch messages for
   * @param options - Optional pagination parameters
   * @returns Promise resolving to an array of messages
   */
  getByConversationId(
    conversationId: string,
    options?: PaginationOptions
  ): Promise<MessageDTO[]>;

  /**
   * Search messages within a conversation
   * @param conversationId - The conversation ID to search within
   * @param searchTerm - The search term to match against message content
   * @returns Promise resolving to an array of matching messages
   */
  search(conversationId: string, searchTerm: string): Promise<MessageDTO[]>;

  /**
   * Create a new message
   * @param messageData - The message data to create
   * @returns Promise resolving to the created message
   */
  create(messageData: CreateMessageData): Promise<MessageDTO>;

  /**
   * Create multiple messages in bulk
   * @param messages - Array of message data to create
   * @returns Promise resolving to an array of created messages
   */
  bulkCreate(messages: CreateMessageData[]): Promise<MessageDTO[]>;

  /**
   * Delete a message by ID
   * @param id - The message ID to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string): Promise<void>;
}
