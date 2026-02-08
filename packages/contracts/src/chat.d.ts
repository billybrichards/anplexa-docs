/**
 * Chat API Contracts
 *
 * Shared type definitions for chat endpoints.
 * These types define the API contract between frontend and backend.
 * Includes streaming response types and Zod validation schemas.
 */
import { z } from 'zod';
import type { PersonalityMode } from './auth';
export interface ChatPreferences {
    length?: 'brief' | 'moderate' | 'detailed';
    style?: 'casual' | 'thoughtful' | 'creative';
}
export interface ChatRequest {
    conversationId?: string;
    message: string;
    preferences?: ChatPreferences;
    personalityMode?: PersonalityMode;
    storeLocally?: boolean;
    newChat?: boolean;
}
export type MessageRole = 'user' | 'assistant' | 'system';
export interface MessageDTO {
    id: string;
    conversationId: string;
    role: MessageRole;
    content: string;
    createdAt: string;
}
export interface ConversationDTO {
    id: string;
    userId: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface ConversationWithMessagesDTO extends ConversationDTO {
    messages: MessageDTO[];
}
export interface ChatConfigResponse {
    companion: {
        name: string;
        welcomeTitle: string;
        welcomeMessage: string;
    };
    defaults: {
        length: 'brief' | 'moderate' | 'detailed';
        style: 'casual' | 'thoughtful' | 'creative';
    };
}
/**
 * Server-Sent Events (SSE) data format for streaming chat responses.
 *
 * Event types:
 * - 'start': Signals beginning of response with metadata
 * - 'token': Individual token/chunk of the response
 * - 'done': Signals completion with final metadata
 * - 'error': Error occurred during streaming
 */
export interface SSEStartEvent {
    type: 'start';
    conversationId: string;
    messageId: string;
}
export interface SSETokenEvent {
    type: 'token';
    content: string;
}
export interface SSEDoneEvent {
    type: 'done';
    conversationId: string;
    messageId: string;
    creditsRemaining?: number;
}
export interface SSEErrorEvent {
    type: 'error';
    error: string;
    code?: string;
}
export type SSEEvent = SSEStartEvent | SSETokenEvent | SSEDoneEvent | SSEErrorEvent;
export interface AmplexaProfile {
    funnel?: string;
    funnelName?: string;
    primaryNeed?: string;
    communicationStyle?: string;
    pace?: string;
    tags?: string[];
}
export interface ChatError {
    error: string;
    code?: string;
    details?: unknown;
}
export interface InsufficientCreditsError extends ChatError {
    code: 'INSUFFICIENT_CREDITS';
    creditsRequired: number;
    creditsAvailable: number;
}
export declare const ChatPreferencesSchema: z.ZodObject<{
    length: z.ZodOptional<z.ZodEnum<["brief", "moderate", "detailed"]>>;
    style: z.ZodOptional<z.ZodEnum<["casual", "thoughtful", "creative"]>>;
}, "strict", z.ZodTypeAny, {
    length?: "moderate" | "brief" | "detailed";
    style?: "thoughtful" | "casual" | "creative";
}, {
    length?: "moderate" | "brief" | "detailed";
    style?: "thoughtful" | "casual" | "creative";
}>;
export declare const ChatRequestSchema: z.ZodObject<{
    conversationId: z.ZodOptional<z.ZodString>;
    message: z.ZodString;
    preferences: z.ZodOptional<z.ZodObject<{
        length: z.ZodOptional<z.ZodEnum<["brief", "moderate", "detailed"]>>;
        style: z.ZodOptional<z.ZodEnum<["casual", "thoughtful", "creative"]>>;
    }, "strict", z.ZodTypeAny, {
        length?: "moderate" | "brief" | "detailed";
        style?: "thoughtful" | "casual" | "creative";
    }, {
        length?: "moderate" | "brief" | "detailed";
        style?: "thoughtful" | "casual" | "creative";
    }>>;
    personalityMode: z.ZodOptional<z.ZodEnum<["nurturing", "playful", "dominant", "filthy_sexy", "intimate_companion", "intellectual_muse"]>>;
    storeLocally: z.ZodOptional<z.ZodBoolean>;
    newChat: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    personalityMode?: "nurturing" | "playful" | "dominant" | "filthy_sexy" | "intimate_companion" | "intellectual_muse";
    conversationId?: string;
    preferences?: {
        length?: "moderate" | "brief" | "detailed";
        style?: "thoughtful" | "casual" | "creative";
    };
    message?: string;
    storeLocally?: boolean;
    newChat?: boolean;
}, {
    personalityMode?: "nurturing" | "playful" | "dominant" | "filthy_sexy" | "intimate_companion" | "intellectual_muse";
    conversationId?: string;
    preferences?: {
        length?: "moderate" | "brief" | "detailed";
        style?: "thoughtful" | "casual" | "creative";
    };
    message?: string;
    storeLocally?: boolean;
    newChat?: boolean;
}>;
export declare const MessageDTOSchema: z.ZodObject<{
    id: z.ZodString;
    conversationId: z.ZodString;
    role: z.ZodEnum<["user", "assistant", "system"]>;
    content: z.ZodString;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
    createdAt?: string;
    conversationId?: string;
    role?: "user" | "assistant" | "system";
    content?: string;
}, {
    id?: string;
    createdAt?: string;
    conversationId?: string;
    role?: "user" | "assistant" | "system";
    content?: string;
}>;
export declare const ConversationDTOSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    title: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    userId?: string;
    title?: string;
}, {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    userId?: string;
    title?: string;
}>;
export declare const SSEStartEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"start">;
    conversationId: z.ZodString;
    messageId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversationId?: string;
    type?: "start";
    messageId?: string;
}, {
    conversationId?: string;
    type?: "start";
    messageId?: string;
}>;
export declare const SSETokenEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"token">;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content?: string;
    type?: "token";
}, {
    content?: string;
    type?: "token";
}>;
export declare const SSEDoneEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"done">;
    conversationId: z.ZodString;
    messageId: z.ZodString;
    creditsRemaining: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    conversationId?: string;
    type?: "done";
    messageId?: string;
    creditsRemaining?: number;
}, {
    conversationId?: string;
    type?: "done";
    messageId?: string;
    creditsRemaining?: number;
}>;
export declare const SSEErrorEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"error">;
    error: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "error";
    code?: string;
    error?: string;
}, {
    type?: "error";
    code?: string;
    error?: string;
}>;
export declare const SSEEventSchema: z.ZodUnion<[z.ZodObject<{
    type: z.ZodLiteral<"start">;
    conversationId: z.ZodString;
    messageId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversationId?: string;
    type?: "start";
    messageId?: string;
}, {
    conversationId?: string;
    type?: "start";
    messageId?: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"token">;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content?: string;
    type?: "token";
}, {
    content?: string;
    type?: "token";
}>, z.ZodObject<{
    type: z.ZodLiteral<"done">;
    conversationId: z.ZodString;
    messageId: z.ZodString;
    creditsRemaining: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    conversationId?: string;
    type?: "done";
    messageId?: string;
    creditsRemaining?: number;
}, {
    conversationId?: string;
    type?: "done";
    messageId?: string;
    creditsRemaining?: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"error">;
    error: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "error";
    code?: string;
    error?: string;
}, {
    type?: "error";
    code?: string;
    error?: string;
}>]>;
export declare const AmplexaProfileSchema: z.ZodObject<{
    funnel: z.ZodOptional<z.ZodString>;
    funnelName: z.ZodOptional<z.ZodString>;
    primaryNeed: z.ZodOptional<z.ZodString>;
    communicationStyle: z.ZodOptional<z.ZodString>;
    pace: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    communicationStyle?: string;
    funnel?: string;
    funnelName?: string;
    primaryNeed?: string;
    pace?: string;
    tags?: string[];
}, {
    communicationStyle?: string;
    funnel?: string;
    funnelName?: string;
    primaryNeed?: string;
    pace?: string;
    tags?: string[];
}>;
export type ValidatedChatRequest = z.infer<typeof ChatRequestSchema>;
export type ValidatedChatPreferences = z.infer<typeof ChatPreferencesSchema>;
export type ValidatedMessageDTO = z.infer<typeof MessageDTOSchema>;
export type ValidatedConversationDTO = z.infer<typeof ConversationDTOSchema>;
export type ValidatedSSEEvent = z.infer<typeof SSEEventSchema>;
export type ValidatedAmplexaProfile = z.infer<typeof AmplexaProfileSchema>;
//# sourceMappingURL=chat.d.ts.map