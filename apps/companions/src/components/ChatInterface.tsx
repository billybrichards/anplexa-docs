'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { parseSSEStream } from '@/lib/sse-parser';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatInterfaceProps {
  companionName?: string;
  companionPersonality?: string;
  companionPersonaId?: string;
  userId?: string;
}

export function ChatInterface({
  companionName = 'Companion',
  companionPersonaId,
  userId = 'guest',
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ──────────────────────────────────────────────────────────────────
  // Load chat history on mount
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!companionPersonaId) {
      setIsLoadingHistory(false);
      return;
    }

    const loadHistory = async () => {
      try {
        console.log('[ChatInterface] Loading history for companion:', companionPersonaId);
        const response = await fetch(
          `${apiBase}/api/chat/messages-by-companion/${encodeURIComponent(companionPersonaId)}?userId=${encodeURIComponent(userId)}`,
        );

        if (!response.ok) {
          console.warn('[ChatInterface] Failed to load history:', response.status);
          setIsLoadingHistory(false);
          return;
        }

        const data = await response.json();

        if (data.conversationId) {
          setConversationId(data.conversationId);
          console.log('[ChatInterface] Restored conversationId:', data.conversationId);
        }

        if (data.messages && data.messages.length > 0) {
          const loadedMessages: Message[] = data.messages.map((m: { id: string; role: string; content: string; createdAt: string }) => ({
            id: m.id,
            content: m.content,
            sender: m.role === 'user' ? 'user' : 'assistant',
            timestamp: new Date(m.createdAt),
          }));
          setMessages(loadedMessages);
          console.log('[ChatInterface] Loaded', loadedMessages.length, 'messages from history');
        }
      } catch (err) {
        console.warn('[ChatInterface] Error loading history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [companionPersonaId, userId, apiBase]);

  // ──────────────────────────────────────────────────────────────────
  // Send message
  // ──────────────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setAgentStatus('thinking');

    // Create streaming assistant message
    const assistantId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      isStreaming: true,
    }]);

    try {
      abortControllerRef.current = new AbortController();

      const payload = {
        message: input,
        userId,
        companionPersonaId,
        conversationId: conversationId || undefined,
      };
      console.log('[ChatInterface] Sending to /api/chat/send:', {
        companionPersonaId: companionPersonaId || '(undefined!)',
        conversationId: conversationId || '(new)',
        userId,
        messageLength: input.length,
      });

      const response = await fetch(`${apiBase}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error('[ChatInterface] Chat send failed:', response.status, errorBody);
        throw new Error(`Chat failed (${response.status})`);
      }

      for await (const event of parseSSEStream(response)) {
        switch (event.type) {
          case 'token':
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, content: m.content + event.content } : m,
            ));
            break;
          case 'agent_activity':
            setAgentStatus(event.status);
            break;
          case 'conversation':
            // Server sent us the conversationId for this chat
            if ('conversationId' in event && event.conversationId) {
              setConversationId(event.conversationId as string);
              console.log('[ChatInterface] Got conversationId from server:', event.conversationId);
            }
            break;
          case 'done':
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, isStreaming: false } : m,
            ));
            // Capture conversationId from done event if present
            if ('conversationId' in event && event.conversationId) {
              setConversationId(event.conversationId as string);
            }
            break;
          case 'error':
            setMessages(prev => prev.map(m =>
              m.id === assistantId
                ? { ...m, content: m.content || `Error: ${event.message}`, isStreaming: false }
                : m,
            ));
            break;
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`, isStreaming: false }
          : m,
      ));
    } finally {
      setIsStreaming(false);
      setAgentStatus(null);
    }
  }, [input, isStreaming, userId, companionPersonaId, conversationId, apiBase]);

  return (
    <div className="flex flex-col h-screen" style={{ background: '#1a1a2e' }}>
      {/* Header */}
      <div
        className="p-4"
        style={{
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
        }}
      >
        <h1 className="text-xl font-bold" style={{ color: '#d4af37' }}>
          {companionName}
        </h1>
        {agentStatus && (
          <p className="text-sm mt-1" style={{ color: '#9d4edd', opacity: 0.8 }}>
            {agentStatus === 'thinking' && 'Thinking...'}
            {agentStatus === 'responding' && 'Typing...'}
            {agentStatus === 'tool_call' && 'Using a tool...'}
            {agentStatus === 'tool_return' && 'Processing result...'}
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full" style={{ color: '#9d4edd', opacity: 0.7 }}>
            <div className="text-center space-y-2">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#d4af37' }} />
              <p>Loading conversation...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full" style={{ color: '#9d4edd', opacity: 0.7 }}>
            Start a conversation with {companionName}!
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] px-4 py-2 rounded-lg whitespace-pre-wrap"
                style={
                  msg.sender === 'user'
                    ? { background: 'linear-gradient(135deg, #9d4edd 0%, #7b2cbf 100%)', color: '#f5f3e7' }
                    : { background: 'rgba(45, 45, 68, 0.6)', color: '#f5f3e7', border: '1px solid rgba(157, 78, 221, 0.3)' }
                }
              >
                {msg.content}
                {msg.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-gold animate-pulse" />}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 flex gap-2" style={{ borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
          placeholder="Type your message..."
          disabled={isStreaming || isLoadingHistory}
          className="flex-1 rounded px-3 py-2"
          style={{
            background: 'rgba(45, 45, 68, 0.8)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: '#f5f3e7',
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={isStreaming || !input.trim() || isLoadingHistory}
          className="px-4 py-2 rounded font-semibold transition-all"
          style={{
            background: isStreaming ? 'rgba(212, 175, 55, 0.3)' : 'linear-gradient(135deg, #d4af37 0%, #f4e16b 100%)',
            color: '#1a1a2e',
          }}
        >
          {isStreaming ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
