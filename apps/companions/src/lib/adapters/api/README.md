# API Client Adapter

Centralized HTTP client for all API communications in the Anplexa Companions application.

## Overview

The `apiClient` is a single instance of the `ApiClient` class that handles all HTTP requests to the backend API. This ensures:

- Consistent error handling across the application
- Centralized authentication management
- Easy mocking for testing
- Global request/response intercepting (if needed)
- Single configuration point for the API base URL

## Usage

```typescript
import { apiClient } from '@/lib/adapters/api';

// GET request
const user = await apiClient.get('/auth/me');

// POST request
const message = await apiClient.post('/chat/messages', {
  conversationId: 'conv-123',
  content: 'Hello!',
  role: 'user',
});

// PUT request
const updated = await apiClient.put('/chat/messages/msg-1', {
  content: 'Updated message',
});

// PATCH request
const patched = await apiClient.patch('/settings', {
  language: 'es',
});

// DELETE request
await apiClient.delete('/chat/messages/msg-1');
```

## API

### Methods

#### `get<T>(endpoint: string, signal?: AbortSignal): Promise<T>`

Make a GET request to the API.

```typescript
const messages = await apiClient.get<Message[]>('/chat/messages');
```

#### `post<T>(endpoint: string, body?: unknown, signal?: AbortSignal): Promise<T>`

Make a POST request to the API.

```typescript
const created = await apiClient.post('/chat/messages', {
  content: 'Hello',
  role: 'user',
});
```

#### `put<T>(endpoint: string, body?: unknown, signal?: AbortSignal): Promise<T>`

Make a PUT request to the API.

```typescript
const updated = await apiClient.put('/chat/messages/msg-1', {
  content: 'Updated',
});
```

#### `patch<T>(endpoint: string, body?: unknown, signal?: AbortSignal): Promise<T>`

Make a PATCH request to the API.

```typescript
const patched = await apiClient.patch('/settings', {
  theme: 'dark',
});
```

#### `delete<T>(endpoint: string, signal?: AbortSignal): Promise<T>`

Make a DELETE request to the API.

```typescript
await apiClient.delete('/chat/messages/msg-1');
```

### Header Management

#### `setHeader(key: string, value: string): void`

Set a default header that will be included in all requests.

```typescript
// Add authentication token
apiClient.setHeader('Authorization', `Bearer ${token}`);
```

#### `removeHeader(key: string): void`

Remove a default header.

```typescript
apiClient.removeHeader('Authorization');
```

#### `getHeaders(): Record<string, string>`

Get all current default headers.

```typescript
const headers = apiClient.getHeaders();
console.log(headers);
```

## Configuration

The API client is initialized with default configuration:

```typescript
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
});
```

### Environment Variables

- `NEXT_PUBLIC_API_URL`: Base URL for API requests (default: `/api`)

### Custom Initialization

Create a custom instance if needed:

```typescript
import { ApiClient } from '@/lib/adapters/api';

const customClient = new ApiClient({
  baseUrl: 'https://api.example.com',
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

## Error Handling

The client throws `ApiError` for failed requests:

```typescript
import { ApiError } from '@/lib/adapters/api';

try {
  await apiClient.get('/some/endpoint');
} catch (err) {
  if (err instanceof ApiError) {
    console.log(err.code);        // Error code
    console.log(err.statusCode);  // HTTP status code
    console.log(err.message);     // Error message
  }
}
```

### Error Codes

- `NETWORK_ERROR`: Network connectivity issue
- `HTTP_4xx`: HTTP 4xx status codes
- `HTTP_5xx`: HTTP 5xx status codes
- Custom codes from server response

## Request Cancellation

Support abort signals for cancellable requests:

```typescript
const controller = new AbortController();

const loadPromise = apiClient.get(
  '/long-running-endpoint',
  controller.signal
);

// Cancel the request
controller.abort();

try {
  await loadPromise;
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('Request was cancelled');
  }
}
```

## Authentication

Add authentication tokens after initialization:

```typescript
// On login
const token = await login(credentials);
apiClient.setHeader('Authorization', `Bearer ${token}`);

// On logout
apiClient.removeHeader('Authorization');
```

## Response Types

The client is fully typed with TypeScript:

```typescript
interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

// Type-safe API call
const message = await apiClient.post<ChatMessage>('/chat/messages', {
  conversationId: 'conv-123',
  content: 'Hello',
  role: 'user',
});

// TypeScript knows message is ChatMessage
console.log(message.content);
```

## Testing

Mock the API client in tests:

```typescript
import { vi } from 'vitest';
import { apiClient } from '@/lib/adapters/api';

vi.mock('@/lib/adapters/api');

describe('MyComponent', () => {
  it('should load data', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      id: '1',
      name: 'Test',
    });

    // Your test code here
  });
});
```

## Best Practices

1. **Always use apiClient**: Never use `fetch()` directly in components or hooks
2. **Type responses**: Use generic type parameters for type safety
3. **Handle errors**: Catch and handle `ApiError` appropriately
4. **Cancel requests**: Use abort signals for long-running requests
5. **Centralize headers**: Use `setHeader()` for authentication instead of setting headers per-request

## See Also

- [useMessagePersistence Hook](../../hooks/README.md)
- [Storage Service](../storage/README.md)
