/**
 * Conversation Repository Interface
 *
 * Defines the contract for conversation data access operations.
 * Implements Clean Architecture repository pattern for conversation persistence.
 */

import type { Conversation } from '@anplexa/database';

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Data required to create a new conversation
 */
export interface CreateConversationData {
  id: string;
  userId: string;
  title?: string | null;
  companionPersonaId?: string | null;
  lettaAgentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Repository interface for conversation data access
 */
export interface IConversationRepository {
  // Query methods
  getAll(): Promise<Conversation[]>;
  getById(id: string): Promise<Conversation | null>;
  getByUserId(userId: string, options?: PaginationOptions): Promise<Conversation[]>;
  searchByContent(userId: string, searchTerm: string): Promise<Conversation[]>;

  // Command methods
  create(conversationData: CreateConversationData): Promise<Conversation>;
  update(id: string, updates: Partial<Conversation>): Promise<Conversation>;
  delete(id: string): Promise<void>;
}
