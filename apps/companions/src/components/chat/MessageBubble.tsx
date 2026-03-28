'use client';

import type { ChatMessage } from '@/stores/chatStore';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-lg whitespace-pre-wrap ${
          isUser
            ? 'bg-gradient-to-br from-[#9d4edd] to-[#7b2cbf] text-cream'
            : 'bg-nebula/60 text-cream border border-[rgba(157,78,221,0.3)]'
        }`}
      >
        {message.content}
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-gold animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  );
}
