# Storage Service Adapter

Centralized abstraction over browser storage (localStorage, sessionStorage) in the Anplexa Companions application.

## Overview

The `storageService` provides a clean interface for storing and retrieving data from browser storage. This ensures:

- Consistent data persistence across the application
- Easy switching between storage backends
- JSON serialization/deserialization
- Optional expiration support
- Mock-friendly interface for testing
- Automatic key prefixing to avoid conflicts

## Usage

```typescript
import { storageService } from '@/lib/adapters/storage';

// Store data
storageService.set('user-preferences', {
  theme: 'dark',
  language: 'en',
});

// Retrieve data
const prefs = storageService.get('user-preferences');

// Remove data
storageService.remove('user-preferences');

// Check if key exists
if (storageService.has('user-preferences')) {
  console.log('Preferences exist');
}

// Get all keys
const keys = storageService.keys();

// Clear all data
storageService.clear();
```

## API

### Methods

#### `set<T>(key: string, value: T, options?: StorageOptions): void`

Store a value in storage with optional expiration.

```typescript
// Simple storage
storageService.set('theme', 'dark');

// With expiration (5 minutes)
storageService.set('temp-token', token, {
  expireIn: 5 * 60 * 1000,
});
```

#### `get<T>(key: string): T | null`

Retrieve a value from storage. Returns `null` if not found or expired.

```typescript
const theme = storageService.get<string>('theme');
const prefs = storageService.get<Preferences>('user-preferences');
```

#### `remove(key: string): void`

Remove a value from storage.

```typescript
storageService.remove('temp-token');
```

#### `has(key: string): boolean`

Check if a key exists in storage (and is not expired).

```typescript
if (storageService.has('auth-token')) {
  // Token exists
}
```

#### `keys(): string[]`

Get all storage keys with the Anplexa prefix.

```typescript
const allKeys = storageService.keys();
console.log(allKeys); // ['theme', 'user-preferences', ...]
```

#### `clear(): void`

Clear all Anplexa-prefixed storage items.

```typescript
storageService.clear();
```

## Configuration

The storage service is initialized with localStorage by default:

```typescript
export const storageService = new StorageService('localStorage');
export const sessionStorageService = new StorageService('sessionStorage');
```

### Custom Initialization

Create a custom instance if needed:

```typescript
import { StorageService } from '@/lib/adapters/storage';

const sessionStorage = new StorageService('sessionStorage');
sessionStorage.set('temp-data', { /* ... */ });
```

## Key Prefixing

All keys are automatically prefixed with `anplexa_` to avoid conflicts:

```typescript
storageService.set('theme', 'dark');
// Stored as: anplexa_theme
```

This prefix is automatically handled and transparent to users of the service.

## Expiration

Store values with automatic expiration:

```typescript
// Store token that expires in 1 hour
storageService.set('auth-token', token, {
  expireIn: 60 * 60 * 1000,
});

// Later, retrieving an expired value returns null
const token = storageService.get('auth-token'); // null if expired
```

## Type Safety

The storage service is fully typed with TypeScript:

```typescript
interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  fontSize: number;
}

// Type-safe storage
storageService.set<UserPreferences>('prefs', {
  theme: 'dark',
  language: 'en',
  fontSize: 16,
});

// Type-safe retrieval
const prefs = storageService.get<UserPreferences>('prefs');

// TypeScript knows the type
if (prefs?.theme === 'dark') {
  console.log('Dark theme enabled');
}
```

## Error Handling

The storage service gracefully handles errors:

```typescript
// If storage is full or disabled, operations log warnings but don't throw
storageService.set('large-data', veryLargeObject);
// If this fails, a warning is logged but no exception is thrown

// Retrieve operations return null on error
const data = storageService.get('invalid-json-key');
// Returns null and logs warning, no exception
```

## Use Cases

### Message Caching

```typescript
// Store messages from a conversation
const messages = [...];
storageService.set(`messages_${conversationId}`, messages);

// Retrieve cached messages
const cached = storageService.get(`messages_${conversationId}`);
if (cached) {
  // Use cached data immediately
  displayMessages(cached);

  // Fetch fresh data in background
  fetchFreshMessages();
}
```

### User Preferences

```typescript
// Save user preferences
const preferences = {
  theme: 'dark',
  fontSize: 14,
  notifications: true,
};
storageService.set('user-preferences', preferences);

// Load on app startup
const saved = storageService.get('user-preferences');
if (saved) {
  applyPreferences(saved);
}
```

### Temporary Tokens

```typescript
// Store authentication token with 24-hour expiration
const token = await getAuthToken();
storageService.set('auth-token', token, {
  expireIn: 24 * 60 * 60 * 1000,
});

// Later retrieve (returns null if expired)
const savedToken = storageService.get('auth-token');
if (!savedToken) {
  // Re-authenticate
  redirectToLogin();
}
```

## Testing

Mock the storage service in tests:

```typescript
import { vi } from 'vitest';
import { storageService } from '@/lib/adapters/storage';

vi.mock('@/lib/adapters/storage');

describe('MyComponent', () => {
  it('should use cached data', () => {
    const mockData = [{ id: '1', name: 'Test' }];
    vi.mocked(storageService.get).mockReturnValueOnce(mockData);

    // Your test code here
    expect(storageService.get).toHaveBeenCalledWith('messages_conv-1');
  });
});
```

## Limitations

- **Storage Quota**: Browser storage has size limits (typically 5-10MB for localStorage)
- **Synchronous**: All operations are synchronous (no async access)
- **String-Based**: Only strings are natively supported (objects are JSON serialized)
- **Client-Only**: Only available in browser, not on server (Next.js SSR)

## Best Practices

1. **Use for caching**: Store frequently accessed data to reduce API calls
2. **Avoid large objects**: Keep stored data reasonably sized
3. **Set expiration**: Use expiration for temporary data like tokens
4. **Type your data**: Always specify types for stored objects
5. **Handle null**: Always check for null when retrieving data
6. **Clear on logout**: Remove sensitive data when user logs out

```typescript
// Good: Clear sensitive data on logout
const logout = () => {
  storageService.remove('auth-token');
  storageService.remove('user-data');
  // or
  storageService.clear(); // Clear all Anplexa data
};
```

## See Also

- [useMessagePersistence Hook](../../hooks/README.md)
- [API Client](../api/README.md)
