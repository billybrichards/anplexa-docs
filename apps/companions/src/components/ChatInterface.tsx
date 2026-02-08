'use client';

import React, { useState } from 'react';
import { usePreferences, useUpgradeModal } from '../hooks';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

/**
 * ChatInterface Component
 * Main chat UI component that uses usePreferences and useUpgradeModal hooks
 * for preference management and upgrade modal state
 */
export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [messageCount, setMessageCount] = useState(0);

  // Use preferences hook
  const { preferences, updatePreferences, resetPreferences, isLoading: prefsLoading } =
    usePreferences();

  // Use upgrade modal hook
  const {
    isOpen: upgradeModalOpen,
    close: closeUpgradeModal,
    shouldShow: shouldShowUpgradePrompt,
    trigger: triggerUpgradeModal,
  } = useUpgradeModal({
    messageLimit: 10,
    guestMessageCount: messageCount,
  });

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Increment message count
    const newCount = messageCount + 1;
    setMessageCount(newCount);

    // Check if upgrade prompt should be triggered
    if (newCount >= 10) {
      triggerUpgradeModal('message_limit_reached');
    }

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `This is a response using ${preferences.tone} tone.`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 500);
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: unknown) => {
    updatePreferences({ [key]: value } as Parameters<typeof updatePreferences>[0]);
  };

  if (prefsLoading) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: '#1a1a2e' }}
      >
        <div
          style={{
            color: '#d4af37',
            fontSize: '1.25rem',
            textShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
          }}
        >
          Loading preferences...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: '#1a1a2e' }}>
      {/* Header with preferences */}
      <div
        className="p-4 space-y-3"
        style={{
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)'
        }}
      >
        <h1
          className="text-2xl font-bold"
          style={{
            color: '#d4af37',
            textShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
          }}
        >
          AI Companion Chat
        </h1>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label
              className="block font-semibold mb-1"
              style={{ color: '#f5f3e7' }}
            >
              Voice
            </label>
            <select
              value={preferences.voice}
              onChange={(e) => handlePreferenceChange('voice', e.target.value)}
              className="w-full rounded px-2 py-1"
              style={{
                background: 'rgba(45, 45, 68, 0.8)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#f5f3e7',
              }}
            >
              <option value="default" style={{ background: '#2d2d44', color: '#f5f3e7' }}>Default</option>
              <option value="calm" style={{ background: '#2d2d44', color: '#f5f3e7' }}>Calm</option>
              <option value="energetic" style={{ background: '#2d2d44', color: '#f5f3e7' }}>Energetic</option>
            </select>
          </div>

          <div>
            <label
              className="block font-semibold mb-1"
              style={{ color: '#f5f3e7' }}
            >
              Tone
            </label>
            <select
              value={preferences.tone}
              onChange={(e) => handlePreferenceChange('tone', e.target.value)}
              className="w-full rounded px-2 py-1"
              style={{
                background: 'rgba(45, 45, 68, 0.8)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#f5f3e7',
              }}
            >
              <option value="casual" style={{ background: '#2d2d44', color: '#f5f3e7' }}>Casual</option>
              <option value="formal" style={{ background: '#2d2d44', color: '#f5f3e7' }}>Formal</option>
              <option value="professional" style={{ background: '#2d2d44', color: '#f5f3e7' }}>Professional</option>
            </select>
          </div>

          <div>
            <label
              className="block font-semibold mb-1"
              style={{ color: '#f5f3e7' }}
            >
              Response Length
            </label>
            <select
              value={preferences.responseLength}
              onChange={(e) => handlePreferenceChange('responseLength', e.target.value)}
              className="w-full rounded px-2 py-1"
              style={{
                background: 'rgba(45, 45, 68, 0.8)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#f5f3e7',
              }}
            >
              <option value="short" style={{ background: '#2d2d44', color: '#f5f3e7' }}>Short</option>
              <option value="medium" style={{ background: '#2d2d44', color: '#f5f3e7' }}>Medium</option>
              <option value="long" style={{ background: '#2d2d44', color: '#f5f3e7' }}>Long</option>
            </select>
          </div>

          <div>
            <label
              className="block font-semibold mb-1"
              style={{ color: '#f5f3e7' }}
            >
              Language
            </label>
            <select
              value={preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              className="w-full rounded px-2 py-1"
              style={{
                background: 'rgba(45, 45, 68, 0.8)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#f5f3e7',
              }}
            >
              <option value="en" style={{ background: '#2d2d44', color: '#f5f3e7' }}>English</option>
              <option value="es" style={{ background: '#2d2d44', color: '#f5f3e7' }}>Spanish</option>
              <option value="fr" style={{ background: '#2d2d44', color: '#f5f3e7' }}>French</option>
            </select>
          </div>
        </div>

        <button
          onClick={resetPreferences}
          className="px-3 py-1 text-sm rounded transition-all"
          style={{
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            color: '#d4af37',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.25)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Reset Preferences
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div
            className="flex items-center justify-center h-full"
            style={{ color: '#9d4edd', opacity: 0.7 }}
          >
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-xs px-4 py-2 rounded-lg"
                style={
                  msg.sender === 'user'
                    ? {
                        background: 'linear-gradient(135deg, #9d4edd 0%, #7b2cbf 100%)',
                        color: '#f5f3e7',
                        boxShadow: '0 4px 15px rgba(157, 78, 221, 0.4)',
                      }
                    : {
                        background: 'rgba(45, 45, 68, 0.6)',
                        color: '#f5f3e7',
                        border: '1px solid rgba(157, 78, 221, 0.3)',
                        boxShadow: '0 2px 10px rgba(157, 78, 221, 0.2)',
                      }
                }
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message count indicator */}
      <div
        className="p-2 text-xs"
        style={{
          borderTop: '1px solid rgba(212, 175, 55, 0.2)',
          background: 'rgba(45, 45, 68, 0.3)',
          color: '#d4af37'
        }}
      >
        Messages: {messageCount}/10 {shouldShowUpgradePrompt && '(Limit reached)'}
      </div>

      {/* Input area */}
      <div
        className="p-4 flex gap-2"
        style={{ borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Type your message..."
          className="flex-1 rounded px-3 py-2"
          style={{
            background: 'rgba(45, 45, 68, 0.8)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: '#f5f3e7',
          }}
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 rounded transition-all font-semibold"
          style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #f4e16b 100%)',
            color: '#1a1a2e',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.6)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Send
        </button>
      </div>

      {/* Upgrade Modal */}
      {upgradeModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0, 0, 0, 0.7)' }}
        >
          <div
            className="rounded-lg p-6 max-w-sm"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
              border: '2px solid rgba(212, 175, 55, 0.4)',
              boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)',
            }}
          >
            <h2
              className="text-xl font-bold mb-2"
              style={{
                color: '#d4af37',
                textShadow: '0 0 15px rgba(212, 175, 55, 0.4)'
              }}
            >
              Message Limit Reached
            </h2>
            <p className="mb-4" style={{ color: '#f5f3e7', opacity: 0.9 }}>
              You've reached the free message limit. Upgrade to continue enjoying unlimited
              conversations with your AI companion.
            </p>
            <div className="flex gap-2">
              <button
                onClick={closeUpgradeModal}
                className="flex-1 px-4 py-2 rounded transition-all"
                style={{
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: '#d4af37',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Later
              </button>
              <button
                className="flex-1 px-4 py-2 rounded transition-all font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #f4e16b 100%)',
                  color: '#1a1a2e',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
