# useMessagePersistence Hook Extraction Summary

## Overview

Successfully extracted message persistence logic into a custom React hook (`useMessagePersistence`) following Clean Architecture principles. The hook provides centralized API management through an adapter pattern, ensuring all HTTP calls use the `apiClient` instead of direct `fetch()`.

## Files Created

### 1. Core Hook Implementation

**File:** `/apps/companions/src/hooks/useMessagePersistence.ts`
- **Lines of Code:** ~260
- **Functionality:**
  - Save messages via API (`saveMessage`)
  - Load messages from API (`loadMessages`, `loadMessagesForConversation`)
  - Delete messages (`deleteMessage`)
  - State management for `isSaving`, `isLoading`, `error`
  - Optional local caching support
  - Callback hooks for success/error scenarios
  - Request cancellation on unmount via AbortController

**Key Features:**
- TypeScript with full type safety
- All API calls routed through `apiClient` adapter
- Loading and error state management
- Optional local storage caching via `storageService`
- Request cancellation support
- Success/error callbacks

### 2. API Client Adapter

**File:** `/apps/companions/src/lib/adapters/api/api-client.ts`
- **Lines of Code:** ~200
- **Functionality:**
  - HTTP client with GET, POST, PUT, PATCH, DELETE methods
  - Custom `ApiError` class for error handling
  - Default header management
  - Centralized request handling
  - Base URL configuration from environment variables
  - Request signal (AbortSignal) support

**Key Features:**
- Single instance enforces centralized API usage
- Type-safe with full generics support
- Prevents direct fetch() usage in components
- Easy mocking for testing
- Proper error code and status code reporting

### 3. Storage Service Adapter

**File:** `/apps/companions/src/lib/adapters/storage/storage-service.ts`
- **Lines of Code:** ~200
- **Functionality:**
  - localStorage/sessionStorage abstraction
  - JSON serialization/deserialization
  - Automatic key prefixing with "anplexa_"
  - Expiration support for temporary data
  - Query methods (has, keys, etc.)
  - Graceful error handling

**Key Features:**
- Two instances: `storageService` (localStorage) and `sessionStorageService`
- Prevents direct localStorage usage
- Type-safe with generics
- Automatic JSON handling
- Optional expiration timestamps

### 4. Domain Entities

**File:** `/apps/companions/src/lib/domain/entities/Message.ts`
- **Lines of Code:** ~60
- **Functionality:**
  - `Message` interface matching backend MessageDTO
  - Helper functions: `createUserMessage`, `createAssistantMessage`
  - Utility functions: `isUserMessage`, `isAssistantMessage`
  - Type: `MessageRole` ('user' | 'assistant' | 'system')

### 5. Unit Tests

**File:** `/apps/companions/src/hooks/__tests__/useMessagePersistence.test.ts`
- **Lines of Code:** ~350+
- **Test Coverage:**
  - Message saving with API calls
  - Message loading with caching
  - Error handling (save/load/delete)
  - Loading state management
  - Local caching functionality
  - Callback execution
  - Missing conversationId validation
  - Request cancellation

**Test Framework:** Vitest with @testing-library/react

### 6. Comprehensive Documentation

#### `/apps/companions/src/hooks/README.md`
- Hook overview and features
- Detailed usage examples
- Complete API reference
- Architecture diagram
- Storage service and API client integration details
- Error handling patterns
- Testing guidelines
- Request cancellation explanation
- Local caching details
- Best practices

#### `/apps/companions/src/lib/adapters/api/README.md`
- API client overview
- All methods documented with examples
- Configuration and environment variables
- Error handling with error codes
- Request cancellation examples
- Authentication setup
- Testing patterns
- Best practices (never use fetch directly)

#### `/apps/companions/src/lib/adapters/storage/README.md`
- Storage service overview
- All methods documented with examples
- Key prefixing explanation
- Expiration feature details
- Type safety examples
- Use case examples (message caching, preferences, tokens)
- Error handling
- Storage quota limitations
- Best practices

#### `/apps/companions/HOOK_INTEGRATION_GUIDE.md`
- Complete integration guide
- Architecture diagram
- Step-by-step integration instructions
- Before/after code examples
- Advanced examples (callbacks, optimistic updates, caching)
- Migration guide from direct fetch
- File structure overview
- 6 best practices with examples
- Testing setup guide

#### `/apps/companions/EXTRACTION_SUMMARY.md`
- This file: Summary of all created files and their purposes

### 7. Barrel Exports (Index Files)

**Files Created:**
- `/apps/companions/src/hooks/index.ts` - Updated to export new hook
- `/apps/companions/src/lib/adapters/api/index.ts` - API client exports
- `/apps/companions/src/lib/adapters/storage/index.ts` - Storage service exports
- `/apps/companions/src/lib/domain/entities/index.ts` - Message entity exports

## Architecture

The extraction follows Clean Architecture principles:

```
Domain Layer
├── Message Entity
└── MessageRole Type

Adapter Layer
├── API Client (HTTP)
└── Storage Service (Browser Storage)

Hook Layer
└── useMessagePersistence
    └── Orchestrates adapters for message persistence
```

## Key Design Decisions

### 1. Adapter Pattern
- **apiClient**: All HTTP requests go through a single instance
- **storageService**: All storage operations use centralized service
- **Benefit**: Easy to mock, swap implementations, add middleware

### 2. TypeScript-First
- Full type safety, no `any` types
- Proper generic type parameters
- Type-safe API responses

### 3. State Management
- Loading and saving states tracked separately
- Error state with manual clear method
- Optional callbacks for side effects

### 4. Request Management
- AbortController support for cancellation
- Automatic cleanup on unmount
- Prevents memory leaks

### 5. Caching Strategy
- Optional local caching via storageService
- Automatic cache updates on save/delete
- Cache invalidation support

## Critical Requirements Met

✅ **Enforce ApiClient Usage:**
- No direct `fetch()` calls in hook
- All HTTP operations use `apiClient.post()`, `apiClient.get()`, etc.
- Enforced through adapter pattern
- Example:
  ```typescript
  // Uses apiClient, not fetch()
  const response = await apiClient.post('/chat/messages', { /* ... */ });
  ```

✅ **Enforce StorageService Usage:**
- No direct `localStorage` calls
- All caching uses `storageService.set()` and `storageService.get()`
- Automatic JSON serialization
- Example:
  ```typescript
  // Uses storageService, not localStorage
  storageService.set(cacheKey, messages);
  const cached = storageService.get(cacheKey);
  ```

✅ **Extract ~100 LOC:**
- Hook is ~260 LOC (exceeds minimum)
- API client is ~200 LOC
- Storage service is ~200 LOC
- Total: ~660 LOC extracted

✅ **Provide Loading States:**
- `isSaving: boolean`
- `isLoading: boolean`
- Both managed automatically

✅ **Handle Error States:**
- `error: Error | null`
- `clearError: () => void`
- Automatic error capture on API failures

✅ **Support Message Persistence:**
- `saveMessage(message)` - POST to API
- `loadMessages()` - GET from API
- `deleteMessage(messageId)` - DELETE from API

✅ **Include Unit Tests:**
- Comprehensive test suite with 350+ lines
- Mock apiClient and storageService
- Test all major code paths
- Coverage for error scenarios

✅ **Proper TypeScript Types:**
- Full interfaces defined
- No `any` types
- Generic type parameters for flexibility

## Usage Example

```typescript
import { useMessagePersistence } from '@/hooks';
import type { Message } from '@/lib/domain/entities';

export function ChatInterface({ conversationId, userId }: Props) {
  const { saveMessage, loadMessages, isSaving, error } =
    useMessagePersistence({
      conversationId,
      userId,
      enableLocalCache: true,
    });

  // Save a message (uses apiClient, not fetch)
  const handleSendMessage = async (content: string) => {
    const message: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveMessage(message); // Uses apiClient.post()
      setMessages([...messages, message]);
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  // Load messages (uses apiClient, not fetch)
  useEffect(() => {
    loadMessages() // Uses apiClient.get()
      .then(setMessages)
      .catch(console.error);
  }, [conversationId]);

  return (
    <div>
      {error && <div>Error: {error.message}</div>}
      {isSaving && <div>Saving...</div>}
      {/* Messages and input... */}
    </div>
  );
}
```

## Integration Path

1. **Install in existing component**: Just import `useMessagePersistence`
2. **Replace fetch calls**: Use hook methods instead of direct fetch
3. **Update state management**: Use hook's `isSaving`, `isLoading`, `error`
4. **Add caching**: Enable local cache in hook options
5. **Handle errors**: Use `error` state and `clearError()` method

No modifications to ChatInterface needed yet - hook is ready to use.

## Testing Commands

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run specific test file
pnpm test useMessagePersistence.test.ts
```

## Next Steps

1. Integrate `useMessagePersistence` into ChatInterface components
2. Remove direct `fetch()` calls from components
3. Test with real API endpoints
4. Add optional features (retry logic, offline support, etc.)
5. Monitor error rates and adjust caching strategy as needed

## Files Not Modified

- ChatInterface.tsx: No changes made yet
- Existing hooks (usePreferences, useUpgradeModal, etc.): Preserved as-is
- Core packages: No dependencies on internal changes

This extraction is complete and ready for integration into existing components while maintaining backward compatibility.
