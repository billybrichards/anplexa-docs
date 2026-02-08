/**
 * Chat API Contracts
 *
 * Shared type definitions for chat endpoints.
 * These types define the API contract between frontend and backend.
 * Includes streaming response types and Zod validation schemas.
 */
import { z } from 'zod';
// ============================================================================
// Zod Validation Schemas
// ============================================================================
export const ChatPreferencesSchema = z
    .object({
    length: z.enum(['brief', 'moderate', 'detailed']).optional(),
    style: z.enum(['casual', 'thoughtful', 'creative']).optional(),
})
    .strict();
export const ChatRequestSchema = z.object({
    conversationId: z.string().uuid().optional(),
    message: z.string().min(1, 'Message cannot be empty').max(10000),
    preferences: ChatPreferencesSchema.optional(),
    personalityMode: z
        .enum([
        'nurturing',
        'playful',
        'dominant',
        'filthy_sexy',
        'intimate_companion',
        'intellectual_muse',
    ])
        .optional(),
    storeLocally: z.boolean().optional(),
    newChat: z.boolean().optional(),
});
export const MessageDTOSchema = z.object({
    id: z.string().uuid(),
    conversationId: z.string().uuid(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    createdAt: z.string().datetime(),
});
export const ConversationDTOSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    title: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const SSEStartEventSchema = z.object({
    type: z.literal('start'),
    conversationId: z.string().uuid(),
    messageId: z.string().uuid().optional(),
});
export const SSETokenEventSchema = z.object({
    type: z.literal('token'),
    content: z.string(),
});
export const SSEDoneEventSchema = z.object({
    type: z.literal('done'),
    conversationId: z.string().uuid(),
    messageId: z.string().uuid(),
    creditsRemaining: z.number().nonnegative().optional(),
});
export const SSEErrorEventSchema = z.object({
    type: z.literal('error'),
    error: z.string(),
    code: z.string().optional(),
});
export const SSEEventSchema = z.union([
    SSEStartEventSchema,
    SSETokenEventSchema,
    SSEDoneEventSchema,
    SSEErrorEventSchema,
]);
export const AmplexaProfileSchema = z
    .object({
    funnel: z.string().optional(),
    funnelName: z.string().optional(),
    primaryNeed: z.string().optional(),
    communicationStyle: z.string().optional(),
    pace: z.string().optional(),
    tags: z.array(z.string()).optional(),
})
    .strict();
