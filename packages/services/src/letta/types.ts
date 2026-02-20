/**
 * Letta API Types
 *
 * Types for communicating with the Letta v0.16.4 REST API.
 * Single-agent model (no NSFW/SFW split).
 */

// ── Agent ────────────────────────────────────────────────────────────────────

export interface LettaAgent {
  id: string;
  name: string;
  conversationId: string;
  agentType: 'companion' | 'prompt_enhancer';
  blockIds: string[];
  llmConfig: {
    model: string;
    modelEndpoint: string;
    modelEndpointType: 'ollama' | 'anthropic' | string;
    contextWindow: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAgentInput {
  conversationId: string;
  agentType: 'companion' | 'prompt_enhancer';
  name: string;
  blockIds: string[];
  system?: string;
  modelHandle: string;
  embeddingHandle?: string;
  contextWindowLimit?: number;
  toolIds?: string[];
  metadata?: Record<string, unknown>;
}

// ── Memory Blocks ────────────────────────────────────────────────────────────

export interface MemoryBlock {
  id: string;
  label: string;
  value: string;
  limit: number;
}

export interface CreateMemoryBlockInput {
  label: string;
  value: string;
  limit: number;
}

// ── Messages ─────────────────────────────────────────────────────────────────

export interface LettaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

/** Letta v0.16.4 SSE message format — discriminated union on message_type */
export type LettaMessageType =
  | 'user_message'
  | 'assistant_message'
  | 'reasoning_message'
  | 'internal_monologue'
  | 'tool_call_message'
  | 'tool_return_message'
  | 'usage_statistics';

export interface LettaStreamEvent {
  id?: string;
  message_type: LettaMessageType;
  date?: string;
  content?: string;
  reasoning?: string;
  tool_call?: {
    name: string;
    arguments: string;
  };
  tool_return?: string;
  delta?: string;
}

// ── Streaming ────────────────────────────────────────────────────────────────

export type AgentStreamChunk =
  | string // token text
  | { type: 'activity'; status: 'thinking' | 'responding' | 'tool_call' | 'tool_return'; toolName?: string };

export interface DetectedStreamToolCall {
  toolName: string;
  toolArgs: Record<string, unknown>;
  toolReturn: string;
}

export interface StreamResult {
  messages: LettaMessage[];
  detectedToolCalls: DetectedStreamToolCall[];
}

// ── API Response shapes ──────────────────────────────────────────────────────

export interface LettaAgentResponse {
  id: string;
  name: string;
  model?: string;
  created_at: string;
  updated_at: string;
  system: string;
  memory?: { persona?: string; human?: string; blocks?: unknown[] };
  llm_config?: {
    model: string;
    model_endpoint: string;
    model_endpoint_type: string;
    context_window: number;
  };
  tools?: string[];
  metadata?: Record<string, unknown>;
}

export interface LettaBlockResponse {
  id: string;
  label: string;
  value: string;
  limit: number;
}

// ── Gateway Config ───────────────────────────────────────────────────────────

export interface LettaGatewayConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}
