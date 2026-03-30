'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/hooks/useChat';
import { useLiveKit } from '@/hooks/useLiveKit';
import { AgentActivityIndicator } from './chat/AgentActivityIndicator';
import { MessageBubble } from './chat/MessageBubble';
import { ConversationList } from './chat/ConversationList';
import { CallButton } from './call/CallButton';
import { InCallModal } from './call/InCallModal';

interface ChatInterfaceProps {
  companionName?: string;
  companionPersonality?: string;
  companionPersonaId?: string;
  userId?: string;
  token?: string;
}

export function ChatInterface({
  companionName = 'Companion',
  companionPersonaId,
  token,
}: ChatInterfaceProps) {
  const {
    messages,
    conversationId,
    isStreaming,
    agentActivity,
    error,
    sendMessage,
    abortStream,
  } = useChat({ companionPersonaId, token });

  const livekit = useLiveKit({ conversationId, token });

  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  }, [input, isStreaming, sendMessage]);

  return (
    <div className="flex h-screen bg-cosmic-purple">
      {/* Conversation sidebar */}
      {showSidebar && (
        <div className="w-64 border-r border-gold/20 shrink-0">
          <ConversationList token={token} onClose={() => setShowSidebar(false)} />
        </div>
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-gold/20 bg-gradient-to-br from-[rgba(157,78,221,0.1)] to-[rgba(212,175,55,0.05)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-gold/60 hover:text-gold transition-colors"
              aria-label="Toggle conversations"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gold flex-1">{companionName}</h1>
            <CallButton
              onStartVoice={() => livekit.startCall(false)}
              onStartVideo={() => livekit.startCall(true)}
              isConnecting={livekit.isConnecting}
              disabled={!conversationId}
            />
          </div>
          {agentActivity && <AgentActivityIndicator status={agentActivity} />}
          {(error || livekit.error) && (
            <p className="text-sm mt-1 text-red-400">{error || livekit.error}</p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-stardust/70">
              Start a conversation with {companionName}!
            </div>
          ) : (
            messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 flex gap-2 border-t border-gold/20">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1 rounded px-3 py-2 bg-nebula/80 border border-gold/30 text-cream placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold/50"
          />
          {isStreaming ? (
            <button
              onClick={abortStream}
              className="px-4 py-2 rounded font-semibold transition-all bg-red-500/80 text-cream hover:bg-red-500"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className={`px-4 py-2 rounded font-semibold transition-all text-deep-space ${
                !input.trim()
                  ? 'bg-gold/30 cursor-not-allowed'
                  : 'bg-gradient-to-br from-gold to-gold-light hover:shadow-gold'
              }`}
            >
              Send
            </button>
          )}
        </div>
      </div>

      {/* In-call modal overlay */}
      {livekit.isInCall && livekit.livekitToken && livekit.wsUrl && (
        <InCallModal
          token={livekit.livekitToken}
          wsUrl={livekit.wsUrl}
          roomName={livekit.roomName!}
          companionName={companionName}
          onDisconnect={livekit.endCall}
        />
      )}
    </div>
  );
}
