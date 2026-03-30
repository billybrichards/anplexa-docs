/**
 * Chat Store — Zustand store for managing chat state.
 *
 * Handles: messages, streaming state, agent activity, conversation lifecycle.
 * Uses SSE streaming via parseSSEStream for real-time token delivery.
 */

import { create } from 'zustand';
import { parseSSEStream, type SSEEvent } from '@/lib/sse-parser';
import { API_BASE_URL } from '@/lib/config';
// Local type — mirrors @anplexa/contracts AgentActivityStatus to avoid cross-package resolution issues
type AgentActivityStatus = 'thinking' | 'tool_call' | 'tool_return' | 'responding';

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string;
  /** Server-assigned ID, set once the `start` SSE event arrives. */
  serverMessageId?: string;
  conversationId?: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  isStreaming?: boolean;
}

export interface ChatState {
  // State
  messages: ChatMessage[];
  conversationId: string | null;
  isStreaming: boolean;
  agentActivity: AgentActivityStatus | null;
  error: string | null;

  // Actions
  sendMessage: (params: SendMessageParams) => Promise<void>;
  abortStream: () => void;
  setConversationId: (id: string | null) => void;
  loadMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  clearError: () => void;
}

export interface SendMessageParams {
  message: string;
  companionPersonaId?: string;
  conversationId?: string;
  /** JWT token for Authorization header */
  token?: string;
}

// ============================================================================
// Store
// ============================================================================

let abortController: AbortController | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  conversationId: null,
  isStreaming: false,
  agentActivity: null,
  error: null,

  sendMessage: async (params: SendMessageParams) => {
    const { isStreaming } = get();
    if (isStreaming) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: params.message,
      role: 'user',
      createdAt: new Date(),
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      createdAt: new Date(),
      isStreaming: true,
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isStreaming: true,
      agentActivity: 'thinking',
      error: null,
    }));

    abortController = new AbortController();
    const apiBase = API_BASE_URL;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (params.token) {
        headers['Authorization'] = `Bearer ${params.token}`;
      }

      const response = await fetch(`${apiBase}/api/chat/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: params.message,
          companionPersonaId: params.companionPersonaId,
          conversationId: params.conversationId || get().conversationId,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorBody.error || `Chat request failed (${response.status})`);
      }

      for await (const event of parseSSEStream(response)) {
        handleSSEEvent(event, assistantMessageId, set, get);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled — mark message as not streaming
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMessageId ? { ...m, isStreaming: false } : m,
          ),
        }));
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        set((state) => ({
          error: errorMsg,
          messages: state.messages.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: m.content || `Error: ${errorMsg}`, isStreaming: false }
              : m,
          ),
        }));
      }
    } finally {
      set({ isStreaming: false, agentActivity: null });
      abortController = null;
    }
  },

  abortStream: () => {
    abortController?.abort();
  },

  setConversationId: (id) => set({ conversationId: id }),

  loadMessages: (messages) => set({ messages }),

  clearMessages: () => set({ messages: [], conversationId: null, error: null }),

  clearError: () => set({ error: null }),
}));

// ============================================================================
// SSE Event Handler
// ============================================================================

function handleSSEEvent(
  event: SSEEvent,
  assistantMessageId: string,
  set: (partial: Partial<ChatState> | ((state: ChatState) => Partial<ChatState>)) => void,
  get: () => ChatState,
) {
  switch (event.type) {
    case 'start':
      // Server assigned a conversationId — capture it
      if (event.conversationId && !get().conversationId) {
        set({ conversationId: event.conversationId });
      }
      // Store server-assigned messageId without replacing the lookup key
      // (the closure's assistantMessageId is used by subsequent events)
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantMessageId
            ? { ...m, serverMessageId: event.messageId, conversationId: event.conversationId }
            : m,
        ),
      }));
      break;

    case 'token':
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: m.content + event.content }
            : m,
        ),
      }));
      break;

    case 'activity':
      set({ agentActivity: event.status });
      break;

    case 'done':
      set((state) => ({
        agentActivity: null,
        messages: state.messages.map((m) =>
          m.id === assistantMessageId
            ? { ...m, id: m.serverMessageId || m.id, serverMessageId: undefined, isStreaming: false }
            : m,
        ),
      }));
      break;

    case 'error':
      set((state) => ({
        error: event.error,
        messages: state.messages.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: m.content || `Error: ${event.error}`, isStreaming: false }
            : m,
        ),
      }));
      break;

    case 'media_started':
      // Media events can be handled by UI components that subscribe to the store
      // For now, just log — future: add mediaGenerations array to state
      break;
  }
}
