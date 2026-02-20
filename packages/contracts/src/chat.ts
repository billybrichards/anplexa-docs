/**
 * Chat API Contracts
 *
 * Shared type definitions for chat endpoints.
 * These types define the API contract between frontend and backend.
 * Includes streaming response types and Zod validation schemas.
 */

import { z } from 'zod';
import type { PersonalityMode } from './auth';

// ============================================================================
// Request Types
// ============================================================================

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

// ============================================================================
// Response Types
// ============================================================================

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

// ============================================================================
// Streaming Response Types (Server-Sent Events)
// ============================================================================

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

// ============================================================================
// Amplexa Profile Types (used in chat context)
// ============================================================================

export interface AmplexaProfile {
  funnel?: string;
  funnelName?: string;
  primaryNeed?: string;
  communicationStyle?: string;
  pace?: string;
  tags?: string[];
}

// ============================================================================
// Error Types
// ============================================================================

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
  messageId: z.string().uuid(),
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

// ============================================================================
// Type Inference from Zod Schemas
// ============================================================================

export type ValidatedChatRequest = z.infer<typeof ChatRequestSchema>;
export type ValidatedChatPreferences = z.infer<typeof ChatPreferencesSchema>;
export type ValidatedMessageDTO = z.infer<typeof MessageDTOSchema>;
export type ValidatedConversationDTO = z.infer<typeof ConversationDTOSchema>;
export type ValidatedSSEEvent = z.infer<typeof SSEEventSchema>;
export type ValidatedAmplexaProfile = z.infer<typeof AmplexaProfileSchema>;
