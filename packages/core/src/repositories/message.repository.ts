/**
 * Message Repository Implementation
 *
 * Implements the IMessageRepository interface using Drizzle ORM.
 * Handles all database operations for message entities.
 */

import { randomUUID } from 'crypto';
import type { Database } from '@anplexa/database';
import { messages, eq, and, like, asc } from '@anplexa/database';
import type { MessageDTO } from '@anplexa/contracts';
import type {
  IMessageRepository,
  PaginationOptions,
  CreateMessageData,
} from './interfaces/message.repository.interface.js';

/**
 * Message Repository
 *
 * Provides data access operations for messages using Drizzle ORM.
 * Optimized for bulk operations and large message histories.
 */
export class MessageRepository implements IMessageRepository {
  constructor(private readonly db: Database) {}

  /**
   * Get a message by ID
   * Returns null if message is not found
   */
  async getById(id: string): Promise<MessageDTO | null> {
    try {
      const results = await this.db
        .select()
        .from(messages)
        .where(eq(messages.id, id))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.toDTO(results[0]);
    } catch (error) {
      throw new Error(
        `Failed to get message ${id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get messages by conversation ID with optional pagination
   * Returns messages ordered by creation date (oldest first)
   */
  async getByConversationId(
    conversationId: string,
    options?: PaginationOptions
  ): Promise<MessageDTO[]> {
    try {
      let query = this.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(messages.createdAt));

      // Apply pagination if provided (offset must come after limit in SQLite)
      if (options?.limit !== undefined) {
        query = query.limit(options.limit);
        if (options?.offset !== undefined) {
          query = query.offset(options.offset);
        }
      } else if (options?.offset !== undefined) {
        // If only offset is provided, apply a default limit to make SQLite happy
        query = query.limit(100).offset(options.offset);
      }

      const results = await query;

      return results.map(this.toDTO);
    } catch (error) {
      throw new Error(
        `Failed to get messages for conversation ${conversationId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Search messages within a conversation
   * Searches for the term in message content (case-insensitive)
   */
  async search(conversationId: string, searchTerm: string): Promise<MessageDTO[]> {
    try {
      // Use case-insensitive LIKE search
      const searchPattern = `%${searchTerm}%`;

      const results = await this.db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conversationId),
            like(messages.content, searchPattern)
          )
        )
        .orderBy(asc(messages.createdAt));

      return results.map(this.toDTO);
    } catch (error) {
      throw new Error(
        `Failed to search messages in conversation ${conversationId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Create a single message
   */
  async create(messageData: CreateMessageData): Promise<MessageDTO> {
    try {
      const id = randomUUID();
      const createdAt = new Date().toISOString();

      const newMessage = {
        id,
        conversationId: messageData.conversationId,
        role: messageData.role,
        content: messageData.content,
        createdAt,
      };

      await this.db.insert(messages).values(newMessage);

      return this.toDTO(newMessage);
    } catch (error) {
      throw new Error(
        `Failed to create message: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Create multiple messages in bulk
   * Uses a transaction for atomicity and better performance
   */
  async bulkCreate(messageDataArray: CreateMessageData[]): Promise<MessageDTO[]> {
    try {
      if (messageDataArray.length === 0) {
        return [];
      }

      const createdAt = new Date().toISOString();

      // Prepare all messages with IDs and timestamps
      const newMessages = messageDataArray.map((messageData) => ({
        id: randomUUID(),
        conversationId: messageData.conversationId,
        role: messageData.role,
        content: messageData.content,
        createdAt,
      }));

      // Insert all messages in a single query (Drizzle handles batching)
      await this.db.insert(messages).values(newMessages);

      return newMessages.map(this.toDTO);
    } catch (error) {
      throw new Error(
        `Failed to bulk create messages: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Delete a message by ID
   */
  async delete(id: string): Promise<void> {
    try {
      await this.db.delete(messages).where(eq(messages.id, id));
    } catch (error) {
      throw new Error(
        `Failed to delete message ${id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Convert database message to DTO
   * @private
   */
  private toDTO(message: {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    createdAt: string;
  }): MessageDTO {
    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content,
      createdAt: message.createdAt,
    };
  }
}
