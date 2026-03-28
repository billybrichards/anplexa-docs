/**
 * Voice/Video Call API Contracts
 *
 * Shared type definitions for LiveKit voice and video call endpoints.
 */

import { z } from 'zod';

// ============================================================================
// LiveKit Token Request/Response
// ============================================================================

export interface LiveKitTokenRequest {
  conversationId: string;
  hasVideo?: boolean;
}

export interface LiveKitTokenResponse {
  token: string;
  roomName: string;
  wsUrl: string;
}

export interface LiveKitConfigResponse {
  sttModel: string;
  ttsModel: string;
  ttsVoice: string;
  llmModel: string;
  turnDetection: {
    threshold: number;
    prefixPaddingMs: number;
    silenceDurationMs: number;
  };
}

// ============================================================================
// Call Events
// ============================================================================

export interface CallEventDTO {
  roomName: string;
  roomSid?: string;
  conversationId?: string;
  userId?: string;
  companionId?: string;
  sessionId?: string;
  eventType: 'call' | 'agent' | 'error' | 'metric';
  eventName: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
  source?: 'agent' | 'webhook' | 'api';
  metadata?: Record<string, unknown>;
  latencyMs?: number;
}

export interface CallSummaryRequest {
  conversationId: string;
  roomName: string;
  transcript: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  durationSeconds: number;
  messageCount: number;
}

// ============================================================================
// Companion Voice
// ============================================================================

export interface CompanionVoiceDTO {
  id: string;
  voiceId: string;
  voiceName: string;
  gender: string;
  simliFaceId?: string | null;
  ttsModel: string;
  enabled: boolean;
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

export const LiveKitTokenRequestSchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
  hasVideo: z.boolean().optional(),
});

export const CallEventDTOSchema = z.object({
  roomName: z.string().min(1),
  roomSid: z.string().optional(),
  conversationId: z.string().optional(),
  userId: z.string().optional(),
  companionId: z.string().optional(),
  sessionId: z.string().optional(),
  eventType: z.enum(['call', 'agent', 'error', 'metric']),
  eventName: z.string().min(1),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  source: z.enum(['agent', 'webhook', 'api']).optional(),
  metadata: z.record(z.unknown()).optional(),
  latencyMs: z.number().optional(),
});

export const CallEventsRequestSchema = z.object({
  events: z.array(CallEventDTOSchema).min(1).max(100),
});

export const CallSummaryRequestSchema = z.object({
  conversationId: z.string().min(1),
  roomName: z.string().min(1),
  transcript: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.string().optional(),
    }),
  ),
  durationSeconds: z.number().nonnegative(),
  messageCount: z.number().nonnegative(),
});

// ============================================================================
// Type Inference from Zod Schemas
// ============================================================================

export type ValidatedLiveKitTokenRequest = z.infer<typeof LiveKitTokenRequestSchema>;
export type ValidatedCallEventDTO = z.infer<typeof CallEventDTOSchema>;
export type ValidatedCallSummaryRequest = z.infer<typeof CallSummaryRequestSchema>;
