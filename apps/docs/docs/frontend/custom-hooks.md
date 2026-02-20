---
sidebar_position: 1
---

# Custom React Hooks

## Overview

The Anplexa companions application implements four custom React hooks that encapsulate specific functionality concerns. Each hook enforces adapter patterns to ensure loose coupling and testability.

---

## Hook Architecture

### Design Principles

1. **Single Responsibility** - Each hook handles one concern
2. **Adapter Pattern** - Dependencies injected as adapters
3. **Type Safety** - Full TypeScript support
4. **Testability** - Easy to mock dependencies
5. **SSR Compatible** - Safe for server-side rendering

### Directory Structure

```
apps/companions/src/
├── hooks/
│   ├── __tests__/
│   │   ├── useGuestChat.test.ts
│   │   ├── useMessagePersistence.test.ts
│   │   ├── usePreferences.test.ts
│   │   └── useUpgradeModal.test.ts
│   ├── useGuestChat.ts
│   ├── useMessagePersistence.ts
│   ├── usePreferences.ts
│   ├── useUpgradeModal.ts
│   └── index.ts (barrel export)
```

---

## 1. useGuestChat Hook

### Purpose

Manages guest chat conversation flow without user authentication. Handles message state, conversation initialization, and guest session management.

### Type Definitions

```typescript
export interface GuestMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface GuestChatSession {
  sessionId: string;
  createdAt: Date;
  messageCount: number;
}

export interface UseGuestChatOptions {
  apiClient: ApiClientAdapter;
  maxMessages?: number;
  persistToStorage?: boolean;
}

export interface UseGuestChatReturn {
  // State
  messages: GuestMessage[];
  session: GuestChatSession | null;
  isLoading: boolean;
  error: Error | null;

  // Methods
  initializeSession(): Promise<void>;
  sendMessage(content: string): Promise<void>;
  clearChat(): void;
  loadChatHistory(): Promise<void>;
}
```

### Implementation Example

```typescript
export function useGuestChat(
  options: UseGuestChatOptions
): UseGuestChatReturn {
  const { apiClient, maxMessages = 10, persistToStorage = true } = options;

  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [session, setSession] = useState<GuestChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize guest session
  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const newSession = await apiClient.createGuestSession();
      setSession(newSession);
      setError(null);

      // Load persisted messages if available
      if (persistToStorage) {
        const persisted = await loadChatHistory();
        if (persisted.length > 0) {
          setMessages(persisted);
        }
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, persistToStorage]);

  // Send message to API
  const sendMessage = useCallback(
    async (content: string) => {
      if (!session) {
        throw new Error('Session not initialized');
      }

      if (messages.length >= maxMessages) {
        throw new Error(`Maximum message limit (${maxMessages}) reached`);
      }

      try {
        setIsLoading(true);

        // Add user message
        const userMessage: GuestMessage = {
          id: generateId(),
          content,
          sender: 'user',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Get assistant response
        const response = await apiClient.sendGuestMessage(
          session.sessionId,
          content
        );

        const assistantMessage: GuestMessage = {
          id: generateId(),
          content: response.content,
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Persist messages
        if (persistToStorage) {
          await persistMessages(messages);
        }

        setError(null);
      } catch (err) {
        setError(err as Error);
        // Remove failed message
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [session, messages, maxMessages, apiClient, persistToStorage]
  );

  // Clear chat history
  const clearChat = useCallback(async () => {
    setMessages([]);
    if (persistToStorage) {
      await clearPersistedChat(session?.sessionId);
    }
  }, [session, persistToStorage]);

  // Load chat history from storage
  const loadChatHistory = useCallback(async (): Promise<GuestMessage[]> => {
    if (!persistToStorage || !session) {
      return [];
    }
    try {
      return await apiClient.getGuestChatHistory(session.sessionId);
    } catch (err) {
      console.warn('Failed to load chat history:', err);
      return [];
    }
  }, [apiClient, session, persistToStorage]);

  return {
    messages,
    session,
    isLoading,
    error,
    initializeSession,
    sendMessage,
    clearChat,
    loadChatHistory,
  };
}
```

### Usage Example

```typescript
export function ChatApp() {
  const apiClient = useApiClient(); // From context or prop

  const {
    messages,
    session,
    isLoading,
    error,
    initializeSession,
    sendMessage,
    clearChat,
  } = useGuestChat({
    apiClient,
    maxMessages: 10,
    persistToStorage: true,
  });

  // Initialize on mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isUser={msg.sender === 'user'}
          />
        ))}
      </div>

      {error && <ErrorAlert error={error} />}

      <ChatInput
        onSend={sendMessage}
        disabled={isLoading || !session}
        messageCount={messages.length}
      />

      <button onClick={clearChat} disabled={isLoading}>
        Clear Chat
      </button>
    </div>
  );
}
```

### Adapter Pattern (ApiClientAdapter)

```typescript
export interface ApiClientAdapter {
  createGuestSession(): Promise<GuestChatSession>;
  sendGuestMessage(
    sessionId: string,
    content: string
  ): Promise<{ content: string }>;
  getGuestChatHistory(sessionId: string): Promise<GuestMessage[]>;
}

// Implementation
export class FetchApiClient implements ApiClientAdapter {
  constructor(private baseUrl: string) {}

  async createGuestSession(): Promise<GuestChatSession> {
    const res = await fetch(`${this.baseUrl}/chat/guest/session`, {
      method: 'POST',
    });
    return res.json();
  }

  async sendGuestMessage(
    sessionId: string,
    content: string
  ): Promise<{ content: string }> {
    const res = await fetch(
      `${this.baseUrl}/chat/guest/message`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, content }),
      }
    );
    return res.json();
  }

  async getGuestChatHistory(sessionId: string): Promise<GuestMessage[]> {
    const res = await fetch(
      `${this.baseUrl}/chat/guest/${sessionId}/history`
    );
    return res.json();
  }
}
```

---

## 2. useMessagePersistence Hook

### Purpose

Handles persistence of messages to localStorage with automatic syncing, offline support, and storage quota management.

### Type Definitions

```typescript
export interface UseMessagePersistenceOptions {
  storageService: StorageServiceAdapter;
  key?: string;
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Max items to store
}

export interface UseMessagePersistenceReturn {
  messages: Message[];
  saveMessage(message: Message): Promise<void>;
  loadMessages(): Promise<Message[]>;
  clearMessages(): Promise<void>;
  syncWithRemote(remoteMessages: Message[]): Promise<void>;
  isSynced: boolean;
}

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  synced?: boolean;
}
```

### Implementation Example

```typescript
export function useMessagePersistence(
  options: UseMessagePersistenceOptions
): UseMessagePersistenceReturn {
  const {
    storageService,
    key = 'guest_messages',
    ttl = 24 * 60 * 60 * 1000, // 24 hours
    maxSize = 100,
  } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isSynced, setIsSynced] = useState(true);

  // Load messages from storage on mount
  useEffect(() => {
    loadMessages();
  }, []);

  // Save message to persistent storage
  const saveMessage = useCallback(
    async (message: Message) => {
      try {
        const stored = await loadMessages();

        // Check size limit
        if (stored.length >= maxSize) {
          // Remove oldest messages
          stored.splice(0, stored.length - maxSize + 1);
        }

        const updated = [...stored, message];
        await storageService.save(key, updated, { ttl });
        setMessages(updated);
        setIsSynced(false);
      } catch (err) {
        console.error('Failed to save message:', err);
        throw err;
      }
    },
    [storageService, key, ttl, maxSize]
  );

  // Load all messages from storage
  const loadMessages = useCallback(async (): Promise<Message[]> => {
    try {
      const stored = await storageService.get(key);
      if (!stored) return [];

      const messages = stored as Message[];
      setMessages(messages);
      return messages;
    } catch (err) {
      console.warn('Failed to load messages:', err);
      return [];
    }
  }, [storageService, key]);

  // Clear all persisted messages
  const clearMessages = useCallback(async () => {
    try {
      await storageService.remove(key);
      setMessages([]);
      setIsSynced(true);
    } catch (err) {
      console.error('Failed to clear messages:', err);
      throw err;
    }
  }, [storageService, key]);

  // Sync local messages with remote state
  const syncWithRemote = useCallback(
    async (remoteMessages: Message[]) => {
      try {
        // Merge local and remote, avoiding duplicates
        const merged = mergeMessages(messages, remoteMessages);
        await storageService.save(key, merged, { ttl });
        setMessages(merged);
        setIsSynced(true);
      } catch (err) {
        console.error('Failed to sync messages:', err);
        throw err;
      }
    },
    [messages, storageService, key, ttl]
  );

  return {
    messages,
    saveMessage,
    loadMessages,
    clearMessages,
    syncWithRemote,
    isSynced,
  };
}

// Helper function to merge messages
function mergeMessages(local: Message[], remote: Message[]): Message[] {
  const map = new Map<string, Message>();

  // Add remote messages first
  remote.forEach((msg) => map.set(msg.id, msg));

  // Add local messages, overwriting remote if newer
  local.forEach((msg) => {
    const existing = map.get(msg.id);
    if (!existing || msg.timestamp > existing.timestamp) {
      map.set(msg.id, msg);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
}
```

### Storage Adapter Pattern

```typescript
export interface StorageServiceAdapter {
  get(key: string): Promise<any>;
  save(key: string, value: any, options?: { ttl?: number }): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

// localStorage implementation
export class LocalStorageService implements StorageServiceAdapter {
  async get(key: string): Promise<any> {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const { value, expiresAt } = JSON.parse(item);

    // Check expiration
    if (expiresAt && Date.now() > expiresAt) {
      await this.remove(key);
      return null;
    }

    return value;
  }

  async save(key: string, value: any, options?: { ttl?: number }) {
    const expiresAt = options?.ttl
      ? Date.now() + options.ttl
      : null;

    localStorage.setItem(
      key,
      JSON.stringify({ value, expiresAt })
    );
  }

  async remove(key: string) {
    localStorage.removeItem(key);
  }

  async clear() {
    localStorage.clear();
  }
}
```

---

## 3. usePreferences Hook

### Purpose

Manages user/companion preferences with localStorage persistence and state synchronization.

### Type Definitions

```typescript
export interface CompanionPreferences {
  voice?: string;
  personality?: string;
  language?: string;
  responseLength?: 'short' | 'medium' | 'long';
  tone?: 'formal' | 'casual' | 'professional';
  showTypingIndicator?: boolean;
  enableSoundNotifications?: boolean;
}

export interface UsePreferencesReturn {
  preferences: CompanionPreferences;
  updatePreferences(prefs: Partial<CompanionPreferences>): void;
  resetPreferences(): void;
  isLoading: boolean;
}
```

### Implementation Example

```typescript
const DEFAULT_PREFERENCES: CompanionPreferences = {
  voice: 'default',
  personality: 'friendly',
  language: 'en',
  responseLength: 'medium',
  tone: 'casual',
  showTypingIndicator: true,
  enableSoundNotifications: true,
};

export function usePreferences(): UsePreferencesReturn {
  const [preferences, setPreferences] =
    useState<CompanionPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const stored = localStorage.getItem('companion_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (err) {
      console.warn('Failed to load preferences:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(
    (prefs: Partial<CompanionPreferences>) => {
      try {
        const updated = { ...preferences, ...prefs };
        setPreferences(updated);

        // Persist to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'companion_preferences',
            JSON.stringify(updated)
          );
        }
      } catch (err) {
        console.error('Failed to save preferences:', err);
      }
    },
    [preferences]
  );

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('companion_preferences');
    }
  }, []);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isLoading,
  };
}
```

### Usage Example

```typescript
export function PreferencesPanel() {
  const { preferences, updatePreferences, resetPreferences, isLoading } =
    usePreferences();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="preferences">
      <h3>Companion Preferences</h3>

      {/* Voice Selection */}
      <select
        value={preferences.voice || 'default'}
        onChange={(e) =>
          updatePreferences({ voice: e.target.value })
        }
      >
        <option value="default">Default</option>
        <option value="calm">Calm</option>
        <option value="energetic">Energetic</option>
      </select>

      {/* Tone Selection */}
      <select
        value={preferences.tone || 'casual'}
        onChange={(e) =>
          updatePreferences({ tone: e.target.value as any })
        }
      >
        <option value="casual">Casual</option>
        <option value="formal">Formal</option>
        <option value="professional">Professional</option>
      </select>

      {/* Toggle Options */}
      <label>
        <input
          type="checkbox"
          checked={preferences.showTypingIndicator}
          onChange={(e) =>
            updatePreferences({
              showTypingIndicator: e.target.checked,
            })
          }
        />
        Show typing indicator
      </label>

      <label>
        <input
          type="checkbox"
          checked={preferences.enableSoundNotifications}
          onChange={(e) =>
            updatePreferences({
              enableSoundNotifications: e.target.checked,
            })
          }
        />
        Sound notifications
      </label>

      <button onClick={resetPreferences}>Reset to Defaults</button>
    </div>
  );
}
```

---

## 4. useUpgradeModal Hook

### Purpose

Manages upgrade modal visibility and triggers based on usage thresholds.

### Type Definitions

```typescript
export interface UseUpgradeModalOptions {
  messageLimit?: number;
  guestMessageCount?: number;
}

export interface UseUpgradeModalReturn {
  isOpen: boolean;
  open(): void;
  close(): void;
  shouldShow: boolean;
  trigger(reason: string): void;
  triggerReason?: string;
}
```

### Implementation Example

```typescript
export function useUpgradeModal(
  options?: UseUpgradeModalOptions
): UseUpgradeModalReturn {
  const { messageLimit = 10, guestMessageCount = 0 } = options || {};

  const [isOpen, setIsOpen] = useState(false);
  const [triggerReason, setTriggerReason] = useState<string>();

  // Check if should show based on message count
  const shouldShow = useMemo(
    () => guestMessageCount >= messageLimit,
    [guestMessageCount, messageLimit]
  );

  // Open modal
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close modal
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Trigger with reason
  const trigger = useCallback((reason: string) => {
    setTriggerReason(reason);
    open();
  }, [open]);

  return {
    isOpen,
    open,
    close,
    shouldShow,
    trigger,
    triggerReason,
  };
}
```

### Usage Example

```typescript
export function ChatInterface() {
  const [messageCount, setMessageCount] = useState(0);

  const {
    isOpen,
    open,
    close,
    shouldShow,
    trigger,
    triggerReason,
  } = useUpgradeModal({
    messageLimit: 10,
    guestMessageCount: messageCount,
  });

  const handleSendMessage = async (content: string) => {
    // Check limit before sending
    if (shouldShow) {
      trigger('message_limit_reached');
      return;
    }

    // Send message
    setMessageCount((prev) => prev + 1);
  };

  useEffect(() => {
    // Auto-trigger when limit reached
    if (shouldShow && !isOpen) {
      trigger('auto_triggered');
    }
  }, [shouldShow, isOpen, trigger]);

  return (
    <>
      <ChatWindow onSendMessage={handleSendMessage} />

      {isOpen && (
        <UpgradeModal
          reason={triggerReason}
          onClose={close}
          onUpgrade={() => {
            // Handle upgrade
            close();
          }}
        />
      )}

      {shouldShow && !isOpen && (
        <UpgradePrompt onUpgradeClick={open} />
      )}
    </>
  );
}
```

---

## Hook Composition Pattern

Combine multiple hooks for complex behavior:

```typescript
export function FullChatComponent() {
  // Compose hooks together
  const apiClient = useApiClient();

  const {
    messages,
    session,
    initializeSession,
    sendMessage,
  } = useGuestChat({ apiClient });

  const { preferences, updatePreferences } = usePreferences();

  const {
    isOpen: upgradeOpen,
    trigger: triggerUpgrade,
    shouldShow: showUpgradePrompt,
  } = useUpgradeModal({
    messageLimit: preferences.messageLimit || 10,
    guestMessageCount: messages.length,
  });

  const {
    messages: persistedMessages,
    saveMessage,
    isSynced,
  } = useMessagePersistence({
    storageService: new LocalStorageService(),
  });

  // Initialize on mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Sync messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessage(messages[messages.length - 1]);
    }
  }, [messages, saveMessage]);

  return (
    <div className="chat-app">
      <PreferencesPanel
        preferences={preferences}
        onUpdate={updatePreferences}
      />

      <ChatWindow
        messages={messages}
        onSendMessage={async (content) => {
          if (showUpgradePrompt) {
            triggerUpgrade('limit_reached');
            return;
          }
          await sendMessage(content);
        }}
      />

      {upgradeOpen && <UpgradeModal onClose={() => {}} />}
      {!isSynced && <SyncIndicator />}
    </div>
  );
}
```

---

## Testing Hooks

### Unit Test Example

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGuestChat } from './useGuestChat';

describe('useGuestChat', () => {
  let mockApiClient: ApiClientAdapter;

  beforeEach(() => {
    mockApiClient = {
      createGuestSession: vi.fn().mockResolvedValue({
        sessionId: 'test-session',
        createdAt: new Date(),
        messageCount: 0,
      }),
      sendGuestMessage: vi.fn().mockResolvedValue({
        content: 'Hello from assistant',
      }),
      getGuestChatHistory: vi.fn().mockResolvedValue([]),
    };
  });

  it('should initialize session', async () => {
    const { result } = renderHook(() =>
      useGuestChat({ apiClient: mockApiClient })
    );

    await act(async () => {
      await result.current.initializeSession();
    });

    expect(result.current.session).toBeDefined();
    expect(result.current.session?.sessionId).toBe('test-session');
  });

  it('should send message and receive response', async () => {
    const { result } = renderHook(() =>
      useGuestChat({ apiClient: mockApiClient })
    );

    await act(async () => {
      await result.current.initializeSession();
    });

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].content).toBe(
      'Hello from assistant'
    );
  });

  it('should enforce message limit', async () => {
    const { result } = renderHook(() =>
      useGuestChat({ apiClient: mockApiClient, maxMessages: 2 })
    );

    await act(async () => {
      await result.current.initializeSession();
      await result.current.sendMessage('Message 1');
      await result.current.sendMessage('Message 2');
    });

    // Should fail on third message
    await expect(
      act(async () => {
        await result.current.sendMessage('Message 3');
      })
    ).rejects.toThrow('Maximum message limit');
  });
});
```

---

## Best Practices

1. **Adapter Pattern** - Always inject dependencies, never hardcode API calls
2. **SSR Safety** - Check `typeof window !== 'undefined'` before using browser APIs
3. **Error Handling** - Provide error state and meaningful error messages
4. **Loading States** - Track async operations with `isLoading` flags
5. **Type Safety** - Use TypeScript interfaces for all return values
6. **Memoization** - Use `useCallback` and `useMemo` to prevent unnecessary renders
7. **Cleanup** - Implement cleanup logic in useEffect returns
8. **Documentation** - JSDoc comments on hooks and functions

---

## Conclusion

The four custom hooks provide a clean, maintainable way to manage complex state and side effects in the Anplexa companions application. By following the adapter pattern and emphasizing type safety, these hooks remain flexible and testable throughout the application lifecycle.

---

**Document Version**: 1.0
**Last Updated**: January 14, 2026
