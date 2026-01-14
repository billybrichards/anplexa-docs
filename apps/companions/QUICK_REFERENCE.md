# useMessagePersistence - Quick Reference

## Quick Start

```typescript
import { useMessagePersistence } from '@/hooks';
import type { Message } from '@/lib/domain/entities';

const { saveMessage, loadMessages, isSaving, isLoading, error } =
  useMessagePersistence({ conversationId, userId });

// Save a message
await saveMessage(message);

// Load messages
const messages = await loadMessages();
```

## File Locations

| Component | Path |
|-----------|------|
| Hook | `/apps/companions/src/hooks/useMessagePersistence.ts` |
| Tests | `/apps/companions/src/hooks/__tests__/useMessagePersistence.test.ts` |
| API Client | `/apps/companions/src/lib/adapters/api/api-client.ts` |
| Storage Service | `/apps/companions/src/lib/adapters/storage/storage-service.ts` |
| Message Entity | `/apps/companions/src/lib/domain/entities/Message.ts` |

## API Methods

### useMessagePersistence()

```typescript
const {
  // Functions
  saveMessage,                    // (message: Message) => Promise<MessageDTO>
  loadMessages,                   // () => Promise<Message[]>
  loadMessagesForConversation,    // (convId: string) => Promise<Message[]>
  deleteMessage,                  // (messageId: string) => Promise<void>

  // States
  isSaving,                       // boolean
  isLoading,                      // boolean
  error,                          // Error | null

  // Methods
  clearError,                     // () => void
} = useMessagePersistence({ conversationId, userId });
```

## Options

```typescript
interface UseMessagePersistenceOptions {
  conversationId?: string;
  userId?: string;
  enableLocalCache?: boolean;
  cacheKey?: string;
  onSaveSuccess?: (message: Message) => void;
  onSaveError?: (error: Error) => void;
  onLoadSuccess?: (messages: Message[]) => void;
  onLoadError?: (error: Error) => void;
}
```

## Adapters

### apiClient

```typescript
import { apiClient } from '@/lib/adapters/api';

// GET
const data = await apiClient.get<T>(endpoint);

// POST
const data = await apiClient.post<T>(endpoint, body);

// PUT
const data = await apiClient.put<T>(endpoint, body);

// PATCH
const data = await apiClient.patch<T>(endpoint, body);

// DELETE
await apiClient.delete(endpoint);

// Headers
apiClient.setHeader('Authorization', `Bearer ${token}`);
apiClient.removeHeader('Authorization');
```

### storageService

```typescript
import { storageService } from '@/lib/adapters/storage';

// Set
storageService.set('key', value);
storageService.set('key', value, { expireIn: 3600000 });

// Get
const value = storageService.get<Type>('key');

// Check
storageService.has('key');

// Remove
storageService.remove('key');

// Keys
const keys = storageService.keys();

// Clear
storageService.clear();
```

## Message Entity

```typescript
import {
  createUserMessage,
  createAssistantMessage,
  isUserMessage,
  isAssistantMessage,
} from '@/lib/domain/entities';
import type { Message, MessageRole } from '@/lib/domain/entities';

// Create
const userMsg = createUserMessage(conversationId, content);
const assistantMsg = createAssistantMessage(conversationId, content);

// Check
if (isUserMessage(message)) { /* ... */ }
if (isAssistantMessage(message)) { /* ... */ }
```

## Common Patterns

### Basic Chat

```typescript
const [messages, setMessages] = useState<Message[]>([]);
const { saveMessage, loadMessages } = useMessagePersistence({
  conversationId,
});

useEffect(() => {
  loadMessages().then(setMessages);
}, [conversationId]);

const send = async (content: string) => {
  const msg = createUserMessage(conversationId, content);
  await saveMessage(msg);
  setMessages(prev => [...prev, msg]);
};
```

### With Caching

```typescript
const { loadMessages } = useMessagePersistence({
  conversationId,
  enableLocalCache: true,
  cacheKey: conversationId,
});

// First call uses cache if available
const messages = await loadMessages();
```

### With Callbacks

```typescript
const { saveMessage } = useMessagePersistence({
  conversationId,
  onSaveSuccess: (msg) => {
    toast.success('Message saved');
  },
  onSaveError: (err) => {
    toast.error(`Failed: ${err.message}`);
  },
});
```

### With Optimistic Updates

```typescript
const handleSend = async (content: string) => {
  const optimistic: Message = {
    id: `temp_${Date.now()}`,
    conversationId,
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  };

  setMessages(prev => [...prev, optimistic]);

  try {
    const saved = await saveMessage(optimistic);
    setMessages(prev =>
      prev.map(m => m.id === optimistic.id ? saved : m)
    );
  } catch {
    setMessages(prev => prev.filter(m => m.id !== optimistic.id));
  }
};
```

### Error Handling

```typescript
const { error, clearError } = useMessagePersistence({
  conversationId,
});

{error && (
  <div>
    Error: {error.message}
    <button onClick={clearError}>Dismiss</button>
  </div>
)}
```

## Documentation Links

- [Hook README](./src/hooks/README.md)
- [Integration Guide](./HOOK_INTEGRATION_GUIDE.md)
- [API Client README](./src/lib/adapters/api/README.md)
- [Storage Service README](./src/lib/adapters/storage/README.md)
- [Extraction Summary](./EXTRACTION_SUMMARY.md)

## Key Principles

1. ✅ **Never use fetch()** - Always use `apiClient`
2. ✅ **Never use localStorage** - Always use `storageService`
3. ✅ **Handle errors** - Check `error` state or catch exceptions
4. ✅ **Type everything** - Use proper types, not `any`
5. ✅ **Use callbacks** - For side effects after API operations

## Testing

```typescript
import { renderHook } from '@testing-library/react';
import { useMessagePersistence } from '@/hooks';
import { vi } from 'vitest';

vi.mock('@/lib/adapters/api/api-client');

it('should save message', async () => {
  const { result } = renderHook(() =>
    useMessagePersistence({ conversationId: 'conv-1' })
  );

  const message: Message = { /* ... */ };
  await result.current.saveMessage(message);

  expect(result.current.isSaving).toBe(false);
});
```

## Migration Checklist

- [ ] Import hook into component
- [ ] Initialize hook with options
- [ ] Replace fetch() calls with hook methods
- [ ] Remove manual loading/error state management
- [ ] Add error handling UI
- [ ] Test with actual API endpoints
- [ ] Enable local caching if needed
- [ ] Add callbacks for user feedback

## Troubleshooting

**Issue:** "conversationId is required"
- **Fix:** Ensure conversationId is passed to hook options

**Issue:** Cannot find module '@/hooks'
- **Fix:** Check alias configuration in tsconfig.json

**Issue:** apiClient is undefined
- **Fix:** Ensure import is `import { apiClient } from '@/lib/adapters/api'`

**Issue:** Tests fail with mock errors
- **Fix:** Mock both apiClient and storageService in test setup

## Performance Tips

1. Enable local caching for frequently accessed conversations
2. Use optimistic updates for better perceived performance
3. Implement request cancellation for search/filter operations
4. Limit message history size with pagination
5. Clear cache on logout to avoid memory leaks

## Security Notes

1. Always validate message content on backend
2. Use HTTPS for API communication
3. Set authentication headers via `apiClient.setHeader()`
4. Never store sensitive data in localStorage
5. Clear auth tokens on logout: `apiClient.removeHeader('Authorization')`
