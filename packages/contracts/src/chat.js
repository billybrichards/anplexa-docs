"use strict";
/**
 * Chat API Contracts
 *
 * Shared type definitions for chat endpoints.
 * These types define the API contract between frontend and backend.
 * Includes streaming response types and Zod validation schemas.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplexaProfileSchema = exports.SSEEventSchema = exports.SSEErrorEventSchema = exports.SSEDoneEventSchema = exports.SSETokenEventSchema = exports.SSEStartEventSchema = exports.ConversationDTOSchema = exports.MessageDTOSchema = exports.ChatRequestSchema = exports.ChatPreferencesSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// Zod Validation Schemas
// ============================================================================
exports.ChatPreferencesSchema = zod_1.z
    .object({
    length: zod_1.z.enum(['brief', 'moderate', 'detailed']).optional(),
    style: zod_1.z.enum(['casual', 'thoughtful', 'creative']).optional(),
})
    .strict();
exports.ChatRequestSchema = zod_1.z.object({
    conversationId: zod_1.z.string().uuid().optional(),
    message: zod_1.z.string().min(1, 'Message cannot be empty').max(10000),
    preferences: exports.ChatPreferencesSchema.optional(),
    personalityMode: zod_1.z
        .enum([
        'nurturing',
        'playful',
        'dominant',
        'filthy_sexy',
        'intimate_companion',
        'intellectual_muse',
    ])
        .optional(),
    storeLocally: zod_1.z.boolean().optional(),
    newChat: zod_1.z.boolean().optional(),
});
exports.MessageDTOSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    conversationId: zod_1.z.string().uuid(),
    role: zod_1.z.enum(['user', 'assistant', 'system']),
    content: zod_1.z.string(),
    createdAt: zod_1.z.string().datetime(),
});
exports.ConversationDTOSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    title: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
exports.SSEStartEventSchema = zod_1.z.object({
    type: zod_1.z.literal('start'),
    conversationId: zod_1.z.string().uuid(),
    messageId: zod_1.z.string().uuid(),
});
exports.SSETokenEventSchema = zod_1.z.object({
    type: zod_1.z.literal('token'),
    content: zod_1.z.string(),
});
exports.SSEDoneEventSchema = zod_1.z.object({
    type: zod_1.z.literal('done'),
    conversationId: zod_1.z.string().uuid(),
    messageId: zod_1.z.string().uuid(),
    creditsRemaining: zod_1.z.number().nonnegative().optional(),
});
exports.SSEErrorEventSchema = zod_1.z.object({
    type: zod_1.z.literal('error'),
    error: zod_1.z.string(),
    code: zod_1.z.string().optional(),
});
exports.SSEEventSchema = zod_1.z.union([
    exports.SSEStartEventSchema,
    exports.SSETokenEventSchema,
    exports.SSEDoneEventSchema,
    exports.SSEErrorEventSchema,
]);
exports.AmplexaProfileSchema = zod_1.z
    .object({
    funnel: zod_1.z.string().optional(),
    funnelName: zod_1.z.string().optional(),
    primaryNeed: zod_1.z.string().optional(),
    communicationStyle: zod_1.z.string().optional(),
    pace: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
})
    .strict();
