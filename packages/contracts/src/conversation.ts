/**
 * Conversation API Contracts
 *
 * Shared type definitions for conversation management endpoints.
 * Includes request/response types for creating, updating, and retrieving conversations.
 * Includes Zod validation schemas for request validation.
 */

import { z } from 'zod';
import type { MessageDTO } from './chat.js';

// ============================================================================
// Request Types
// ============================================================================

export interface CreateConversationRequest {
  title?: string;
}

export interface UpdateConversationRequest {
  title: string;
}

export interface SaveMessagesRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

export interface DeleteConversationRequest {
  conversationId: string;
}

export interface GetConversationsRequest {
  limit?: number;
  offset?: number;
  sortBy?: 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Response Types
// ============================================================================

export interface ConversationSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessage?: string;
}

export interface ConversationListResponse {
  conversations: ConversationSummary[];
  total: number;
}

export interface ConversationDetailResponse {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: MessageDTO[];
}

export interface ConversationMessagesResponse {
  conversationId: string;
  messages: MessageDTO[];
  hasMore: boolean;
}

export interface DeleteConversationResponse {
  message: string;
  conversationId: string;
}

// ============================================================================
// Grouped Conversations (for UI display)
// ============================================================================

export interface GroupedConversations {
  today: ConversationSummary[];
  yesterday: ConversationSummary[];
  thisWeek: ConversationSummary[];
  older: ConversationSummary[];
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

const uuidSchema = z.string().uuid();
const messageRoleSchema = z.enum(['user', 'assistant', 'system']);

export const CreateConversationRequestSchema = z.object({
  title: z.string().max(500).optional(),
});

export const UpdateConversationRequestSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(500),
});

export const SaveMessagesRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: messageRoleSchema,
      content: z.string().min(1, 'Message content cannot be empty').max(10000),
    })
  ),
});

export const DeleteConversationRequestSchema = z.object({
  conversationId: uuidSchema,
});

export const GetConversationsRequestSchema = z.object({
  limit: z.number().positive().max(100).optional(),
  offset: z.number().nonnegative().optional(),
  sortBy: z.enum(['created', 'updated']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const ConversationSummarySchema = z.object({
  id: uuidSchema,
  title: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  messageCount: z.number().nonnegative().optional(),
  lastMessage: z.string().optional(),
});

export const ConversationListResponseSchema = z.object({
  conversations: z.array(ConversationSummarySchema),
  total: z.number().nonnegative(),
});

export const ConversationDetailResponseSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  title: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  messages: z.array(
    z.object({
      id: uuidSchema,
      conversationId: uuidSchema,
      role: messageRoleSchema,
      content: z.string(),
      createdAt: z.string().datetime(),
    })
  ),
});

export const ConversationMessagesResponseSchema = z.object({
  conversationId: uuidSchema,
  messages: z.array(
    z.object({
      id: uuidSchema,
      conversationId: uuidSchema,
      role: messageRoleSchema,
      content: z.string(),
      createdAt: z.string().datetime(),
    })
  ),
  hasMore: z.boolean(),
});

export const DeleteConversationResponseSchema = z.object({
  message: z.string(),
  conversationId: uuidSchema,
});

export const GroupedConversationsSchema = z.object({
  today: z.array(ConversationSummarySchema),
  yesterday: z.array(ConversationSummarySchema),
  thisWeek: z.array(ConversationSummarySchema),
  older: z.array(ConversationSummarySchema),
});

// ============================================================================
// Type Inference from Zod Schemas
// ============================================================================

export type ValidatedCreateConversationRequest = z.infer<
  typeof CreateConversationRequestSchema
>;
export type ValidatedUpdateConversationRequest = z.infer<
  typeof UpdateConversationRequestSchema
>;
export type ValidatedSaveMessagesRequest = z.infer<typeof SaveMessagesRequestSchema>;
export type ValidatedDeleteConversationRequest = z.infer<
  typeof DeleteConversationRequestSchema
>;
export type ValidatedGetConversationsRequest = z.infer<typeof GetConversationsRequestSchema>;
export type ValidatedConversationSummary = z.infer<typeof ConversationSummarySchema>;
export type ValidatedConversationListResponse = z.infer<typeof ConversationListResponseSchema>;
export type ValidatedConversationDetailResponse = z.infer<
  typeof ConversationDetailResponseSchema
>;
export type ValidatedConversationMessagesResponse = z.infer<
  typeof ConversationMessagesResponseSchema
>;
export type ValidatedGroupedConversations = z.infer<typeof GroupedConversationsSchema>;
