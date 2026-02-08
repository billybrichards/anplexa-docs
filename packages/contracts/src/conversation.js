/**
 * Conversation API Contracts
 *
 * Shared type definitions for conversation management endpoints.
 * Includes request/response types for creating, updating, and retrieving conversations.
 * Includes Zod validation schemas for request validation.
 */
import { z } from 'zod';
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
    messages: z.array(z.object({
        role: messageRoleSchema,
        content: z.string().min(1, 'Message content cannot be empty').max(10000),
    })),
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
    messages: z.array(z.object({
        id: uuidSchema,
        conversationId: uuidSchema,
        role: messageRoleSchema,
        content: z.string(),
        createdAt: z.string().datetime(),
    })),
});
export const ConversationMessagesResponseSchema = z.object({
    conversationId: uuidSchema,
    messages: z.array(z.object({
        id: uuidSchema,
        conversationId: uuidSchema,
        role: messageRoleSchema,
        content: z.string(),
        createdAt: z.string().datetime(),
    })),
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
