'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import type { ChatMessage } from '@/stores/chatStore';
import { API_BASE_URL } from '@/lib/config';

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
}

interface ConversationListProps {
  token?: string;
  onClose?: () => void;
}

export function ConversationList({ token, onClose }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const activeConversationId = useChatStore((s) => s.conversationId);
  const setConversationId = useChatStore((s) => s.setConversationId);
  const loadMessages = useChatStore((s) => s.loadMessages);
  const clearMessages = useChatStore((s) => s.clearMessages);

  const apiBase = API_BASE_URL;

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }, [token, apiBase]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const selectConversation = useCallback(
    async (id: string) => {
      if (id === activeConversationId) {
        onClose?.();
        return;
      }
      setConversationId(id);

      // Fetch messages for the selected conversation
      try {
        const res = await fetch(`${apiBase}/api/chat/conversations/${id}/messages`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const msgs = await res.json();
          const mapped: ChatMessage[] = msgs.map((m: { id?: string; role: string; content: string; createdAt?: string }, i: number) => ({
            id: m.id || `msg-${i}`,
            content: m.content,
            role: m.role as 'user' | 'assistant',
            createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          }));
          loadMessages(mapped);
        }
      } catch {
        // Keep current messages on failure
      }
      onClose?.();
    },
    [activeConversationId, setConversationId, loadMessages, apiBase, token, onClose],
  );

  const startNewConversation = useCallback(() => {
    clearMessages();
    onClose?.();
  }, [clearMessages, onClose]);

  return (
    <div className="flex flex-col h-full bg-cosmic-purple">
      <div className="p-3 border-b border-gold/20 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gold">Conversations</h2>
        <button
          onClick={startNewConversation}
          className="text-xs px-2 py-1 rounded bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
        >
          + New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-stardust/50 text-sm">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-stardust/50 text-sm">No conversations yet</div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-nebula/30 transition-colors ${
                conv.id === activeConversationId
                  ? 'bg-nebula/60 text-gold'
                  : 'text-cream hover:bg-nebula/30'
              }`}
            >
              <div className="text-sm truncate">{conv.title}</div>
              <div className="text-xs text-text-muted mt-0.5">
                {new Date(conv.updatedAt || conv.createdAt).toLocaleDateString()}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
