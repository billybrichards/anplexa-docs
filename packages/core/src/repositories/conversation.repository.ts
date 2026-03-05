/**
 * Conversation Repository Implementation
 *
 * Implements IConversationRepository using Drizzle ORM for data access.
 * Handles conversation persistence with PostgreSQL and SQLite support.
 */

import type { Database } from '@anplexa/database';
import { conversations, messages, eq, and, desc, sql } from '@anplexa/database';
import type {
  IConversationRepository,
  CreateConversationData,
  PaginationOptions,
} from './interfaces/conversation.repository.interface.js';
import type { Conversation } from '@anplexa/database';

/**
 * Repository errors
 */
export class ConversationNotFoundError extends Error {
  constructor(id: string) {
    super(`Conversation with id "${id}" not found`);
    this.name = 'ConversationNotFoundError';
  }
}

export class ConversationRepositoryError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ConversationRepositoryError';
  }
}

/**
 * Conversation repository implementation using Drizzle ORM
 */
export class ConversationRepository implements IConversationRepository {
  constructor(private readonly db: Database) {}

  /**
   * Get all conversations
   */
  async getAll(): Promise<Conversation[]> {
    try {
      const result = await this.db
        .select()
        .from(conversations)
        .orderBy(desc(conversations.updatedAt));

      return result;
    } catch (error) {
      throw new ConversationRepositoryError(
        'Failed to get all conversations',
        error as Error
      );
    }
  }

  /**
   * Get a conversation by ID
   */
  async getById(id: string): Promise<Conversation | null> {
    try {
      const result = await this.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      throw new ConversationRepositoryError(
        `Failed to get conversation by id: ${id}`,
        error as Error
      );
    }
  }

  /**
   * Get all conversations for a user with optional pagination
   */
  async getByUserId(
    userId: string,
    options?: PaginationOptions
  ): Promise<Conversation[]> {
    try {
      const { limit = 50, offset = 0 } = options || {};

      const result = await this.db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt))
        .limit(limit)
        .offset(offset);

      return result;
    } catch (error) {
      throw new ConversationRepositoryError(
        `Failed to get conversations for user: ${userId}`,
        error as Error
      );
    }
  }

  /**
   * Search conversations by content in messages
   * Searches through message content and conversation titles
   */
  async searchByContent(
    userId: string,
    searchTerm: string
  ): Promise<Conversation[]> {
    try {
      // Search in conversation titles and message content
      // Using a subquery to find conversations with matching messages
      const searchPattern = `%${searchTerm}%`;

      const result = await this.db
        .selectDistinct({
          id: conversations.id,
          userId: conversations.userId,
          title: conversations.title,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
        })
        .from(conversations)
        .leftJoin(messages, eq(conversations.id, messages.conversationId))
        .where(
          and(
            eq(conversations.userId, userId),
            sql`(${conversations.title} LIKE ${searchPattern} OR ${messages.content} LIKE ${searchPattern})`
          )
        )
        .orderBy(desc(conversations.updatedAt));

      return result as Conversation[];
    } catch (error) {
      throw new ConversationRepositoryError(
        `Failed to search conversations for user: ${userId}`,
        error as Error
      );
    }
  }

  /**
   * Create a new conversation
   */
  async create(conversationData: CreateConversationData): Promise<Conversation> {
    try {
      const now = new Date().toISOString();
      const newConversation: Record<string, unknown> = {
        id: conversationData.id,
        userId: conversationData.userId,
        title: conversationData.title || null,
        createdAt: conversationData.createdAt || now,
        updatedAt: conversationData.updatedAt || now,
      };

      // Include companion and Letta references if provided
      if (conversationData.companionPersonaId) {
        newConversation.companionPersonaId = conversationData.companionPersonaId;
      }
      if (conversationData.lettaAgentId) {
        newConversation.lettaAgentId = conversationData.lettaAgentId;
      }

      const result = await this.db
        .insert(conversations)
        .values(newConversation)
        .returning();

      return result[0];
    } catch (error) {
      throw new ConversationRepositoryError(
        'Failed to create conversation',
        error as Error
      );
    }
  }

  /**
   * Update an existing conversation
   */
  async update(
    id: string,
    updates: Partial<Conversation>
  ): Promise<Conversation> {
    try {
      // First check if conversation exists
      const existing = await this.getById(id);
      if (!existing) {
        throw new ConversationNotFoundError(id);
      }

      // Update with new timestamp
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const result = await this.db
        .update(conversations)
        .set(updateData)
        .where(eq(conversations.id, id))
        .returning();

      return result[0];
    } catch (error) {
      if (error instanceof ConversationNotFoundError) {
        throw error;
      }
      throw new ConversationRepositoryError(
        `Failed to update conversation: ${id}`,
        error as Error
      );
    }
  }

  /**
   * Delete a conversation and its associated messages
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if conversation exists
      const existing = await this.getById(id);
      if (!existing) {
        throw new ConversationNotFoundError(id);
      }

      // Delete associated messages first (foreign key constraint)
      await this.db.delete(messages).where(eq(messages.conversationId, id));

      // Delete the conversation
      await this.db.delete(conversations).where(eq(conversations.id, id));
    } catch (error) {
      if (error instanceof ConversationNotFoundError) {
        throw error;
      }
      throw new ConversationRepositoryError(
        `Failed to delete conversation: ${id}`,
        error as Error
      );
    }
  }
}
