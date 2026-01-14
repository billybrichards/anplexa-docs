"use strict";
/**
 * Conversation API Contracts
 *
 * Shared type definitions for conversation management endpoints.
 * Includes request/response types for creating, updating, and retrieving conversations.
 * Includes Zod validation schemas for request validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupedConversationsSchema = exports.DeleteConversationResponseSchema = exports.ConversationMessagesResponseSchema = exports.ConversationDetailResponseSchema = exports.ConversationListResponseSchema = exports.ConversationSummarySchema = exports.GetConversationsRequestSchema = exports.DeleteConversationRequestSchema = exports.SaveMessagesRequestSchema = exports.UpdateConversationRequestSchema = exports.CreateConversationRequestSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// Zod Validation Schemas
// ============================================================================
const uuidSchema = zod_1.z.string().uuid();
const messageRoleSchema = zod_1.z.enum(['user', 'assistant', 'system']);
exports.CreateConversationRequestSchema = zod_1.z.object({
    title: zod_1.z.string().max(500).optional(),
});
exports.UpdateConversationRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title cannot be empty').max(500),
});
exports.SaveMessagesRequestSchema = zod_1.z.object({
    messages: zod_1.z.array(zod_1.z.object({
        role: messageRoleSchema,
        content: zod_1.z.string().min(1, 'Message content cannot be empty').max(10000),
    })),
});
exports.DeleteConversationRequestSchema = zod_1.z.object({
    conversationId: uuidSchema,
});
exports.GetConversationsRequestSchema = zod_1.z.object({
    limit: zod_1.z.number().positive().max(100).optional(),
    offset: zod_1.z.number().nonnegative().optional(),
    sortBy: zod_1.z.enum(['created', 'updated']).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
exports.ConversationSummarySchema = zod_1.z.object({
    id: uuidSchema,
    title: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    messageCount: zod_1.z.number().nonnegative().optional(),
    lastMessage: zod_1.z.string().optional(),
});
exports.ConversationListResponseSchema = zod_1.z.object({
    conversations: zod_1.z.array(exports.ConversationSummarySchema),
    total: zod_1.z.number().nonnegative(),
});
exports.ConversationDetailResponseSchema = zod_1.z.object({
    id: uuidSchema,
    userId: uuidSchema,
    title: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    messages: zod_1.z.array(zod_1.z.object({
        id: uuidSchema,
        conversationId: uuidSchema,
        role: messageRoleSchema,
        content: zod_1.z.string(),
        createdAt: zod_1.z.string().datetime(),
    })),
});
exports.ConversationMessagesResponseSchema = zod_1.z.object({
    conversationId: uuidSchema,
    messages: zod_1.z.array(zod_1.z.object({
        id: uuidSchema,
        conversationId: uuidSchema,
        role: messageRoleSchema,
        content: zod_1.z.string(),
        createdAt: zod_1.z.string().datetime(),
    })),
    hasMore: zod_1.z.boolean(),
});
exports.DeleteConversationResponseSchema = zod_1.z.object({
    message: zod_1.z.string(),
    conversationId: uuidSchema,
});
exports.GroupedConversationsSchema = zod_1.z.object({
    today: zod_1.z.array(exports.ConversationSummarySchema),
    yesterday: zod_1.z.array(exports.ConversationSummarySchema),
    thisWeek: zod_1.z.array(exports.ConversationSummarySchema),
    older: zod_1.z.array(exports.ConversationSummarySchema),
});
