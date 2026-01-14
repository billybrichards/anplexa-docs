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
    return <div className="flex items-center justify-center h-screen">Loading preferences...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header with preferences */}
      <div className="border-b p-4 space-y-3">
        <h1 className="text-2xl font-bold">AI Companion Chat</h1>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block font-semibold mb-1">Voice</label>
            <select
              value={preferences.voice}
              onChange={(e) => handlePreferenceChange('voice', e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="default">Default</option>
              <option value="calm">Calm</option>
              <option value="energetic">Energetic</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Tone</label>
            <select
              value={preferences.tone}
              onChange={(e) => handlePreferenceChange('tone', e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
              <option value="professional">Professional</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Response Length</label>
            <select
              value={preferences.responseLength}
              onChange={(e) => handlePreferenceChange('responseLength', e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Language</label>
            <select
              value={preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
        </div>

        <button
          onClick={resetPreferences}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
        >
          Reset Preferences
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message count indicator */}
      <div className="border-t bg-gray-50 p-2 text-xs text-gray-600">
        Messages: {messageCount}/10 {shouldShowUpgradePrompt && '(Limit reached)'}
      </div>

      {/* Input area */}
      <div className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Type your message..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>

      {/* Upgrade Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h2 className="text-xl font-bold mb-2">Message Limit Reached</h2>
            <p className="text-gray-600 mb-4">
              You've reached the free message limit. Upgrade to continue enjoying unlimited
              conversations with your AI companion.
            </p>
            <div className="flex gap-2">
              <button
                onClick={closeUpgradeModal}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Later
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
