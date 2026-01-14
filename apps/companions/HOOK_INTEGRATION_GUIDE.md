# useMessagePersistence Hook Integration Guide

This guide explains how to integrate the `useMessagePersistence` hook into existing ChatInterface components.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Integration Steps](#integration-steps)
4. [Examples](#examples)
5. [Migration Guide](#migration-guide)
6. [Best Practices](#best-practices)

## Overview

The `useMessagePersistence` hook extracts message persistence logic from ChatInterface components, providing:

- **Centralized API Management**: All HTTP requests go through the `apiClient` adapter
- **Clean Separation of Concerns**: Message persistence logic is isolated from UI logic
- **State Management**: Automatic handling of loading/saving/error states
- **Type Safety**: Full TypeScript support with proper typing
- **Testability**: Easy to mock and test with isolated logic

## Architecture

```
┌─────────────────────────────────────────┐
│         ChatInterface Component          │
│         (UI and User Interactions)       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    useMessagePersistence Hook           │
│  (Message Persistence Logic)            │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────────┐  ┌─────────────────────┐
│  API Client      │  │  Storage Service    │
│  Adapter         │  │  Adapter            │
└──────────────────┘  └─────────────────────┘
        │                     │
        ▼                     ▼
┌──────────────────────────────────────────┐
│         Browser Storage / Network        │
└──────────────────────────────────────────┘
```

## Integration Steps

### Step 1: Import the Hook

```typescript
import { useMessagePersistence } from '@/hooks';
import type { Message } from '@/lib/domain/entities';
```

### Step 2: Initialize the Hook

In your ChatInterface component:

```typescript
export function ChatInterface({ conversationId, userId }: Props) {
  const {
    saveMessage,
    loadMessages,
    isSaving,
    isLoading,
    error,
    clearError,
  } = useMessagePersistence({
    conversationId,
    userId,
    enableLocalCache: true,
    cacheKey: conversationId,
  });

  // Rest of component...
}
```

### Step 3: Replace Direct fetch() Calls

**Before:**
```typescript
async function sendMessage(content: string) {
  const response = await fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId,
      content,
      role: 'user',
    }),
  });
  const data = await response.json();
  setMessages([...messages, data]);
}
```

**After:**
```typescript
async function sendMessage(content: string) {
  const message: Message = {
    id: crypto.randomUUID(),
    conversationId,
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveMessage(message);
    // Message is saved, UI can be updated
    setMessages([...messages, message]);
  } catch (err) {
    console.error('Failed to send message');
  }
}
```

### Step 4: Handle Loading States

```typescript
return (
  <div className="chat-interface">
    {error && (
      <div className="error-banner">
        {error.message}
        <button onClick={clearError}>Dismiss</button>
      </div>
    )}

    {isLoading && <div className="spinner">Loading messages...</div>}

    <div className="messages">
      {messages.map(msg => (
        <div key={msg.id} className="message">
          {msg.content}
          {msg.role === 'user' && isSaving && <span>Saving...</span>}
        </div>
      ))}
    </div>

    <form onSubmit={handleSendMessage}>
      <input
        type="text"
        disabled={isSaving}
        placeholder="Type a message..."
      />
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Sending...' : 'Send'}
      </button>
    </form>
  </div>
);
```

## Examples

### Basic Usage

```typescript
import { useMessagePersistence } from '@/hooks';
import type { Message } from '@/lib/domain/entities';
import { useState, useEffect } from 'react';

export function BasicChatExample({ conversationId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);

  const { saveMessage, loadMessages, isLoading, error } =
    useMessagePersistence({
      conversationId,
    });

  // Load messages on mount
  useEffect(() => {
    loadMessages()
      .then(setMessages)
      .catch(err => console.error('Failed to load:', err));
  }, [conversationId, loadMessages]);

  const handleSendMessage = async (content: string) => {
    const message: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveMessage(message);
      setMessages([...messages, message]);
    } catch (err) {
      console.error('Failed to send:', err);
    }
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        {messages.map(msg => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>
      <input
        type="text"
        onKeyPress={e => {
          if (e.key === 'Enter') {
            handleSendMessage(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}
```

### With Callbacks

```typescript
const { saveMessage } = useMessagePersistence({
  conversationId,
  userId,
  onSaveSuccess: (message) => {
    // Update UI after successful save
    setMessages(prev => [...prev, message]);
    toast.success('Message sent');
  },
  onSaveError: (error) => {
    // Show error to user
    toast.error(`Failed to send: ${error.message}`);
  },
  onLoadSuccess: (messages) => {
    // Messages loaded successfully
    setMessages(messages);
    scrollToBottom();
  },
  onLoadError: (error) => {
    // Handle load failure
    setLoadError(error);
  },
});
```

### With Optimistic Updates

```typescript
const { saveMessage, isSaving } = useMessagePersistence({
  conversationId,
});

const handleSendMessage = async (content: string) => {
  // Create message with optimistic ID (replaced by server)
  const optimisticMessage: Message = {
    id: `temp_${Date.now()}`, // Temporary ID
    conversationId,
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  };

  // Add to UI immediately (optimistic update)
  setMessages(prev => [...prev, optimisticMessage]);

  try {
    // Send to server
    const savedMessage = await saveMessage(optimisticMessage);

    // Replace optimistic message with server version
    setMessages(prev =>
      prev.map(msg =>
        msg.id === optimisticMessage.id ? savedMessage : msg
      )
    );
  } catch (err) {
    // Remove failed message from UI
    setMessages(prev =>
      prev.filter(msg => msg.id !== optimisticMessage.id)
    );
    toast.error('Failed to send message');
  }
};
```

### With Local Caching

```typescript
const { loadMessages } = useMessagePersistence({
  conversationId,
  enableLocalCache: true,
  cacheKey: `chat_${conversationId}`,
});

useEffect(() => {
  loadMessages().then(msgs => {
    // First render uses cache if available
    // Then fresh data is fetched automatically
    setMessages(msgs);
  });
}, [conversationId]);
```

## Migration Guide

### From Direct Fetch to useMessagePersistence

#### Current Pattern (to replace):

```typescript
// ChatInterface.tsx
async function loadMessages() {
  setIsLoading(true);
  try {
    const response = await fetch(
      `/api/chat/conversations/${conversationId}/messages`
    );
    const data = await response.json();
    setMessages(data);
  } catch (err) {
    setError(err);
  } finally {
    setIsLoading(false);
  }
}

async function saveMessage(message: Message) {
  setIsSaving(true);
  try {
    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    const saved = await response.json();
    setMessages([...messages, saved]);
  } catch (err) {
    setError(err);
  } finally {
    setIsSaving(false);
  }
}
```

#### New Pattern (using hook):

```typescript
// ChatInterface.tsx
import { useMessagePersistence } from '@/hooks';

const {
  saveMessage,
  loadMessages,
  isSaving,
  isLoading,
  error,
} = useMessagePersistence({ conversationId });

// Use saveMessage and loadMessages directly
// No need to manage loading/error state manually
```

### File Structure After Migration

```
apps/companions/src/
├── components/
│   └── ChatInterface.tsx          (Uses useMessagePersistence)
├── hooks/
│   ├── index.ts
│   ├── useMessagePersistence.ts   (NEW: Extracted logic)
│   └── __tests__/
│       └── useMessagePersistence.test.ts
└── lib/
    ├── adapters/
    │   ├── api/
    │   │   ├── api-client.ts       (NEW: API client)
    │   │   └── index.ts
    │   └── storage/
    │       ├── storage-service.ts  (NEW: Storage)
    │       └── index.ts
    └── domain/
        └── entities/
            ├── Message.ts          (NEW: Message entity)
            └── index.ts
```

## Best Practices

### 1. Always Use the Hook for Message Operations

```typescript
// Good
const { saveMessage } = useMessagePersistence({ conversationId });
await saveMessage(message);

// Avoid
await fetch('/api/chat/messages', { /* ... */ });
```

### 2. Handle Errors Gracefully

```typescript
// Good: Show error to user and allow retry
const { error, clearError } = useMessagePersistence({
  conversationId,
});

{error && (
  <ErrorAlert
    message={error.message}
    onDismiss={clearError}
  />
)}

// Avoid: Silently ignore errors
const { saveMessage } = useMessagePersistence({ conversationId });
await saveMessage(message).catch(() => {}); // Bad!
```

### 3. Use Local Caching for Frequently Accessed Data

```typescript
// Good: Cache conversations to reduce API calls
const { loadMessages } = useMessagePersistence({
  conversationId,
  enableLocalCache: true,
  cacheKey: `messages_${conversationId}`,
});

// Avoid: Every render fetches from server
const { loadMessages } = useMessagePersistence({
  conversationId,
  enableLocalCache: false, // No cache
});
```

### 4. Implement Optimistic Updates for Better UX

```typescript
// Good: Show message immediately
const optimisticMsg = createUserMessage(conversationId, content);
setMessages([...messages, optimisticMsg]); // Show immediately

try {
  const saved = await saveMessage(optimisticMsg);
  // Update with server version if different
} catch {
  // Remove if failed
}

// Avoid: Wait for server response
await saveMessage(message);
setMessages([...messages, message]);
```

### 5. Clean Up Resources

```typescript
// Good: The hook handles cleanup automatically
const { saveMessage } = useMessagePersistence({
  conversationId,
});

// Avoid: Leaving pending requests
const promise = saveMessage(message);
// Component unmounts while promise is pending - hook handles it

// Good: Cancel specific requests if needed
const controller = new AbortController();
// Pass signal if API supports it (feature for future)
```

### 6. Type Your Messages

```typescript
// Good: Properly typed
const message: Message = {
  id: crypto.randomUUID(),
  conversationId,
  role: 'user',
  content,
  createdAt: new Date().toISOString(),
};

// Avoid: Using any
const message: any = { /* ... */ };
```

## Testing

See [useMessagePersistence Tests](src/hooks/__tests__/useMessagePersistence.test.ts) for comprehensive test examples.

Quick test setup:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMessagePersistence } from '@/hooks';
import { vi } from 'vitest';

vi.mock('@/lib/adapters/api/api-client');

it('should save a message', async () => {
  const { result } = renderHook(() =>
    useMessagePersistence({ conversationId: 'conv-1' })
  );

  const message = { /* ... */ };
  await result.current.saveMessage(message);

  expect(result.current.isSaving).toBe(false);
});
```

## See Also

- [useMessagePersistence API Reference](src/hooks/README.md)
- [API Client Documentation](src/lib/adapters/api/README.md)
- [Storage Service Documentation](src/lib/adapters/storage/README.md)
- [Domain Entities](src/lib/domain/entities/Message.ts)
