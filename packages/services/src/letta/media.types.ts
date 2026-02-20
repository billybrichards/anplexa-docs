/**
 * Media Generation Types
 *
 * Types for inline image/video generation via Letta custom tools.
 * Ported from Letta-Lonely, adapted for Anplexa (no AURA-API references).
 */

export type MediaType = 'image' | 'video';

export type MediaGenerationStatus =
  | 'pending_confirmation'
  | 'generating'
  | 'completed'
  | 'failed';

export interface MediaGeneration {
  generationId: string;
  type: MediaType;
  status: MediaGenerationStatus;
  enhancedPrompt: string;
  originalDescription: string;
  url?: string;
  progress?: number;
  queuePosition?: number;
  errorMessage?: string;
}

/** Structured JSON returned by generate_image / generate_video Letta tools */
export interface MediaToolReturn {
  type: MediaType;
  enhanced_prompt: string;
  original_description: string;
  status: 'generation_requested';
}

/** Media tool call extracted from SSE stream */
export interface PendingMediaGeneration {
  type: MediaType;
  enhancedPrompt: string;
  originalDescription: string;
}

export const MEDIA_TOOL_NAMES = {
  GENERATE_IMAGE: 'generate_image',
  GENERATE_VIDEO: 'generate_video',
} as const;

/** Input for triggering actual ComfyUI generation */
export interface TriggerGenerationInput {
  type: MediaType;
  enhancedPrompt: string;
  userId: string;
  conversationId: string;
  companionId: string;
}

export interface MediaStatusResponse {
  status: MediaGenerationStatus;
  progress?: number;
  queuePosition?: number;
  imageUrl?: string;
  videoUrl?: string;
  errorMessage?: string;
}
