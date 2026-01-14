# Custom Hooks

This directory contains custom React hooks for the Anplexa Companions application.

## useMessagePersistence

A custom hook for managing message persistence operations through the API adapter.

### Overview

`useMessagePersistence` provides a clean interface for:
- Saving messages to the backend
- Loading messages from the backend
- Deleting messages
- Managing loading and error states
- Optional local caching of messages
- Request cancellation support

### Features

- **API Client Integration**: All HTTP operations go through the `apiClient` adapter, ensuring consistent error handling and testability
- **Loading States**: Track when operations are in progress with `isSaving` and `isLoading`
- **Error Handling**: Centralized error state with `error` and `clearError()`
- **Local Caching**: Optional local storage caching to reduce API calls
- **Callbacks**: Optional success/error callbacks for side effects
- **Request Cancellation**: Automatic cancellation of pending requests on unmount

### Usage

```typescript
import { useMessagePersistence } from '@/hooks';
import type { Message } from '@/lib/domain/entities';

function ChatComponent() {
  const {
    saveMessage,
    loadMessages,
    isSaving,
    isLoading,
    error,
    clearError,
  } = useMessagePersistence({
    conversationId: 'conv-123',
    userId: 'user-456',
    enableLocalCache: true,
    cacheKey: 'conversation-cache',
    onSaveSuccess: (message) => {
      console.log('Message saved:', message);
    },
    onSaveError: (error) => {
      console.error('Save error:', error);
    },
  });

  const handleSendMessage = async (content: string) => {
    const message: Message = {
      id: crypto.randomUUID(),
      conversationId: 'conv-123',
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveMessage(message);
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  const handleLoadMessages = async () => {
    try {
      const messages = await loadMessages();
      console.log('Loaded messages:', messages);
    } catch (err) {
      console.error('Failed to load messages');
    }
  };

  return (
    <div>
      {error && (
        <div>
          Error: {error.message}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      {isSaving && <p>Saving message...</p>}
      {isLoading && <p>Loading messages...</p>}
    </div>
  );
}
```

### API

#### Options

```typescript
interface UseMessagePersistenceOptions {
  conversationId?: string;        // ID of the conversation
  userId?: string;                 // ID of the current user
  enableLocalCache?: boolean;      // Enable local storage caching (default: false)
  cacheKey?: string;              // Key for local cache storage
  onSaveSuccess?: (message: Message) => void;     // Called on successful save
  onSaveError?: (error: Error) => void;           // Called on save error
  onLoadSuccess?: (messages: Message[]) => void;  // Called on successful load
  onLoadError?: (error: Error) => void;           // Called on load error
}
```

#### Return Value

```typescript
interface UseMessagePersistenceReturn {
  // Save a message to the backend
  saveMessage: (message: Message) => Promise<MessageDTO>;

  // Load messages for the current conversation
  loadMessages: () => Promise<Message[]>;

  // Load messages for a specific conversation
  loadMessagesForConversation: (conversationId: string) => Promise<Message[]>;

  // Delete a message
  deleteMessage: (messageId: string) => Promise<void>;

  // Loading state
  isSaving: boolean;
  isLoading: boolean;

  // Error state
  error: Error | null;
  clearError: () => void;
}
```

### Architecture

The hook follows clean architecture principles:

1. **Domain Layer** (`src/lib/domain/entities/`)
   - `Message` entity representing a message in a conversation
   - Helper functions for creating and checking message types

2. **Adapter Layer** (`src/lib/adapters/`)
   - `apiClient`: HTTP client for all API communications
   - `storageService`: Browser storage abstraction

3. **Hook Layer** (`src/hooks/`)
   - `useMessagePersistence`: React hook orchestrating the above layers

### API Client Usage

The hook enforces the use of the `apiClient` adapter instead of direct `fetch()` calls:

**Before (direct fetch):**
```typescript
const response = await fetch('/api/chat/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

**After (using apiClient):**
```typescript
const response = await apiClient.post('/chat/messages', data);
```

### Storage Service Usage

When local caching is enabled, the hook uses `storageService` instead of direct `localStorage` calls:

**Before (direct localStorage):**
```typescript
localStorage.setItem('messages', JSON.stringify(messages));
const cached = JSON.parse(localStorage.getItem('messages') || '{}');
```

**After (using storageService):**
```typescript
storageService.set('messages_conv-123', messages);
const cached = storageService.get('messages_conv-123');
```

### Error Handling

The hook provides comprehensive error handling:

```typescript
const { error, clearError } = useMessagePersistence({ conversationId });

try {
  await saveMessage(message);
} catch (err) {
  // Error is captured in hook state
  console.log(error.message);
}

// Clear error when user dismisses error message
clearError();
```

### Testing

The hook is fully tested with `vitest` and `@testing-library/react`. Tests cover:

- Message saving and loading
- Error handling for all operations
- Loading/saving state management
- Local caching functionality
- Callbacks execution
- Request cancellation

See `__tests__/useMessagePersistence.test.ts` for complete test suite.

### Request Cancellation

The hook automatically cancels pending requests when the component unmounts:

```typescript
// This happens automatically via useEffect cleanup
useEffect(() => {
  return () => {
    // All pending requests are cancelled
    abortControllersRef.current.forEach(controller => {
      controller.abort();
    });
  };
}, []);
```

### Local Caching

Enable local caching to reduce API calls:

```typescript
const { loadMessages } = useMessagePersistence({
  conversationId: 'conv-123',
  enableLocalCache: true,      // Enable caching
  cacheKey: 'main-conversation', // Cache key
});

// First call hits API
const messages = await loadMessages();

// Second call uses cache if available
const cachedMessages = await loadMessages();
```

The cache is automatically updated when:
- Messages are saved
- Messages are deleted
- Messages are loaded from API

### See Also

- [API Client Documentation](../lib/adapters/api/README.md)
- [Storage Service Documentation](../lib/adapters/storage/README.md)
- [Domain Entities](../lib/domain/entities/README.md)
