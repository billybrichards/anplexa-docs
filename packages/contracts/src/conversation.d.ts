/**
 * Conversation API Contracts
 *
 * Shared type definitions for conversation management endpoints.
 * Includes request/response types for creating, updating, and retrieving conversations.
 * Includes Zod validation schemas for request validation.
 */
import { z } from 'zod';
import type { MessageDTO } from './chat';
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
export interface GroupedConversations {
    today: ConversationSummary[];
    yesterday: ConversationSummary[];
    thisWeek: ConversationSummary[];
    older: ConversationSummary[];
}
export declare const CreateConversationRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
}, {
    title?: string | undefined;
}>;
export declare const UpdateConversationRequestSchema: z.ZodObject<{
    title: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
}, {
    title: string;
}>;
export declare const SaveMessagesRequestSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant", "system"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: "user" | "assistant" | "system";
        content: string;
    }, {
        role: "user" | "assistant" | "system";
        content: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    messages: {
        role: "user" | "assistant" | "system";
        content: string;
    }[];
}, {
    messages: {
        role: "user" | "assistant" | "system";
        content: string;
    }[];
}>;
export declare const DeleteConversationRequestSchema: z.ZodObject<{
    conversationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
}, {
    conversationId: string;
}>;
export declare const GetConversationsRequestSchema: z.ZodObject<{
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodEnum<["created", "updated"]>>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    offset?: number | undefined;
    sortBy?: "created" | "updated" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
    sortBy?: "created" | "updated" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const ConversationSummarySchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    messageCount: z.ZodOptional<z.ZodNumber>;
    lastMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    updatedAt: string;
    title: string | null;
    messageCount?: number | undefined;
    lastMessage?: string | undefined;
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    title: string | null;
    messageCount?: number | undefined;
    lastMessage?: string | undefined;
}>;
export declare const ConversationListResponseSchema: z.ZodObject<{
    conversations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        messageCount: z.ZodOptional<z.ZodNumber>;
        lastMessage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }, {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }>, "many">;
    total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    conversations: {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }[];
    total: number;
}, {
    conversations: {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }[];
    total: number;
}>;
export declare const ConversationDetailResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    title: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    messages: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        conversationId: z.ZodString;
        role: z.ZodEnum<["user", "assistant", "system"]>;
        content: z.ZodString;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        conversationId: string;
        role: "user" | "assistant" | "system";
        content: string;
    }, {
        id: string;
        createdAt: string;
        conversationId: string;
        role: "user" | "assistant" | "system";
        content: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    title: string | null;
    messages: {
        id: string;
        createdAt: string;
        conversationId: string;
        role: "user" | "assistant" | "system";
        content: string;
    }[];
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    title: string | null;
    messages: {
        id: string;
        createdAt: string;
        conversationId: string;
        role: "user" | "assistant" | "system";
        content: string;
    }[];
}>;
export declare const ConversationMessagesResponseSchema: z.ZodObject<{
    conversationId: z.ZodString;
    messages: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        conversationId: z.ZodString;
        role: z.ZodEnum<["user", "assistant", "system"]>;
        content: z.ZodString;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        conversationId: string;
        role: "user" | "assistant" | "system";
        content: string;
    }, {
        id: string;
        createdAt: string;
        conversationId: string;
        role: "user" | "assistant" | "system";
        content: string;
    }>, "many">;
    hasMore: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    messages: {
        id: string;
        createdAt: string;
        conversationId: string;
        role: "user" | "assistant" | "system";
        content: string;
    }[];
    conversationId: string;
    hasMore: boolean;
}, {
    messages: {
        id: string;
        createdAt: string;
        conversationId: string;
        role: "user" | "assistant" | "system";
        content: string;
    }[];
    conversationId: string;
    hasMore: boolean;
}>;
export declare const DeleteConversationResponseSchema: z.ZodObject<{
    message: z.ZodString;
    conversationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    message: string;
}, {
    conversationId: string;
    message: string;
}>;
export declare const GroupedConversationsSchema: z.ZodObject<{
    today: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        messageCount: z.ZodOptional<z.ZodNumber>;
        lastMessage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }, {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }>, "many">;
    yesterday: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        messageCount: z.ZodOptional<z.ZodNumber>;
        lastMessage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }, {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }>, "many">;
    thisWeek: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        messageCount: z.ZodOptional<z.ZodNumber>;
        lastMessage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }, {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }>, "many">;
    older: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        messageCount: z.ZodOptional<z.ZodNumber>;
        lastMessage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }, {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    today: {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }[];
    yesterday: {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }[];
    thisWeek: {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }[];
    older: {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }[];
}, {
    today: {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }[];
    yesterday: {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }[];
    thisWeek: {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }[];
    older: {
        id: string;
        createdAt: string;
        updatedAt: string;
        title: string | null;
        messageCount?: number | undefined;
        lastMessage?: string | undefined;
    }[];
}>;
export type ValidatedCreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;
export type ValidatedUpdateConversationRequest = z.infer<typeof UpdateConversationRequestSchema>;
export type ValidatedSaveMessagesRequest = z.infer<typeof SaveMessagesRequestSchema>;
export type ValidatedDeleteConversationRequest = z.infer<typeof DeleteConversationRequestSchema>;
export type ValidatedGetConversationsRequest = z.infer<typeof GetConversationsRequestSchema>;
export type ValidatedConversationSummary = z.infer<typeof ConversationSummarySchema>;
export type ValidatedConversationListResponse = z.infer<typeof ConversationListResponseSchema>;
export type ValidatedConversationDetailResponse = z.infer<typeof ConversationDetailResponseSchema>;
export type ValidatedConversationMessagesResponse = z.infer<typeof ConversationMessagesResponseSchema>;
export type ValidatedGroupedConversations = z.infer<typeof GroupedConversationsSchema>;
//# sourceMappingURL=conversation.d.ts.map