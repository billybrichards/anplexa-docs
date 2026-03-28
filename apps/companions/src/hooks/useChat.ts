/**
 * useChat — Convenience hook wrapping the Zustand chat store.
 *
 * Provides a simple interface for components:
 * - sendMessage(text) — sends with pre-bound companion/auth context
 * - messages, isStreaming, agentActivity, error
 * - abortStream, clearMessages
 */

'use client';

import { useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';

export interface UseChatOptions {
  companionPersonaId?: string;
  token?: string;
}

export function useChat(options: UseChatOptions = {}) {
  const messages = useChatStore((s) => s.messages);
  const conversationId = useChatStore((s) => s.conversationId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const agentActivity = useChatStore((s) => s.agentActivity);
  const error = useChatStore((s) => s.error);
  const sendMessageAction = useChatStore((s) => s.sendMessage);
  const abortStream = useChatStore((s) => s.abortStream);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const clearError = useChatStore((s) => s.clearError);
  const setConversationId = useChatStore((s) => s.setConversationId);
  const loadMessages = useChatStore((s) => s.loadMessages);

  const sendMessage = useCallback(
    (message: string) => {
      return sendMessageAction({
        message,
        companionPersonaId: options.companionPersonaId,
        token: options.token,
      });
    },
    [sendMessageAction, options.companionPersonaId, options.token],
  );

  return {
    messages,
    conversationId,
    isStreaming,
    agentActivity,
    error,
    sendMessage,
    abortStream,
    clearMessages,
    clearError,
    setConversationId,
    loadMessages,
  };
}
