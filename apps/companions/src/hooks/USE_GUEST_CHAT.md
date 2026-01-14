# useGuestChat Hook

A comprehensive React hook for managing guest user chat functionality in the Anplexa Companions app.

## Overview

The `useGuestChat` hook encapsulates all guest-mode logic including:
- Guest message state management
- localStorage persistence with safe access
- Guest message tracking and counting
- Automatic upgrade prompts when message limit is reached
- Guest conversation lifecycle management
- Cleanup when users authenticate

## Installation

The hook is already available in the Anplexa Companions app:

```typescript
import { useGuestChat } from '@/hooks';
```

## API Reference

### useGuestChat()

Main hook function for managing guest chat state and operations.

```typescript
function useGuestChat(options: UseGuestChatOptions): UseGuestChatReturn
```

#### Parameters

**options**: `UseGuestChatOptions`
- `userId?: string` - Current user's ID (undefined for guests)
- `onUpgradePrompt?: () => void` - Callback fired when guest reaches message limit

#### Return Value

**return**: `UseGuestChatReturn`

```typescript
interface UseGuestChatReturn {
  // State
  guestMessages: Message[];              // Array of guest messages
  guestConversation: Conversation | null; // Current guest conversation
  guestMessageCount: number;              // Total messages sent by guest
  isGuest: boolean;                       // Is current user a guest?
  shouldPromptUpgrade: boolean;           // Should show upgrade prompt?

  // Methods
  addGuestMessage: (message: Message) => void;
  loadGuestMessages: () => Promise<void>;
  saveGuestConversation: (conversation: Conversation) => void;
  clearGuestMessages: () => void;
}
```

### Types

#### Message

```typescript
interface Message {
  id: string;                    // Unique message ID
  conversationId: string;        // Parent conversation ID
  role: 'user' | 'assistant' | 'system'; // Message sender role
  content: string;               // Message text content
  createdAt: Date;               // Timestamp of creation
}
```

#### Conversation

```typescript
interface Conversation {
  id: string;            // Unique conversation ID
  userId: string;        // Owner/guest user ID
  title: string | null;  // Optional conversation title
  createdAt: Date;       // When conversation was created
  updatedAt: Date;       // Last update timestamp
}
```

## Usage Examples

### Basic Guest Chat Setup

```typescript
import { useGuestChat } from '@/hooks';

export function ChatInterface() {
  const {
    guestMessages,
    addGuestMessage,
    shouldPromptUpgrade,
    isGuest,
  } = useGuestChat({
    userId: user?.id,
    onUpgradePrompt: () => setShowUpgradeModal(true),
  });

  const handleSendMessage = async (content: string) => {
    if (!isGuest) {
      // Handle authenticated user chat
      return;
    }

    // Create message
    const message: Message = {
      id: generateId(),
      conversationId: currentConversation.id,
      role: 'user',
      content,
      createdAt: new Date(),
    };

    // Add to guest messages (persists to localStorage)
    addGuestMessage(message);
  };

  return (
    <div>
      {guestMessages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      {shouldPromptUpgrade && <UpgradePrompt />}
    </div>
  );
}
```

### Guest Conversation Management

```typescript
const {
  guestConversation,
  saveGuestConversation,
  guestMessages,
} = useGuestChat({ userId: user?.id });

// Create new guest conversation
const handleNewConversation = () => {
  const conversation: Conversation = {
    id: generateId(),
    userId: 'guest',
    title: 'New Chat',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  saveGuestConversation(conversation);
};

// Auto-save conversation when messages change
useEffect(() => {
  if (isGuest && guestConversation && guestMessages.length > 0) {
    saveGuestConversation({
      ...guestConversation,
      updatedAt: new Date(),
    });
  }
}, [guestMessages, isGuest, guestConversation, saveGuestConversation]);
```

### Handling Guest Limits

```typescript
const {
  guestMessageCount,
  shouldPromptUpgrade,
  isGuest,
} = useGuestChat({
  userId: user?.id,
  onUpgradePrompt: showUpgradeModal,
});

const GUEST_LIMIT = 6;

const canSendMessage = () => {
  if (!isGuest) return true;
  return guestMessageCount < GUEST_LIMIT;
};

const handleSend = async (content: string) => {
  if (!canSendMessage()) {
    toast.error('Guest message limit reached. Please sign up to continue.');
    return;
  }

  // Send message...
  addGuestMessage(message);
};
```

### Cleanup on Login

```typescript
// Guest data automatically clears when user logs in
// Hook handles this automatically via:
//
// useEffect(() => {
//   if (!isGuest && guestMessages.length > 0) {
//     clearGuestMessages();
//   }
// }, [isGuest, guestMessages.length, clearGuestMessages]);
//
// No manual cleanup needed!

const handleLogin = async (email: string, password: string) => {
  const user = await authService.login(email, password);
  // Guest messages will be automatically cleared
  return user;
};
```

## Storage Details

### localStorage Keys

The hook uses three localStorage keys for persistence:

| Key | Contents | Type |
|-----|----------|------|
| `anplexa_guest_messages` | Guest messages array (JSON) | string |
| `anplexa_guest_conversation` | Current guest conversation (JSON) | string |
| `anplexa_guest_message_count` | Total message count | string (numeric) |

### Storage Format

**Messages** (persisted as JSON):
```json
[
  {
    "id": "msg-uuid-1",
    "conversationId": "conv-uuid-1",
    "role": "user",
    "content": "Hello!",
    "createdAt": "2025-01-14T12:00:00.000Z"
  }
]
```

**Conversation** (persisted as JSON):
```json
{
  "id": "conv-uuid-1",
  "userId": "guest",
  "title": "My First Chat",
  "createdAt": "2025-01-14T12:00:00.000Z",
  "updatedAt": "2025-01-14T12:05:00.000Z"
}
```

## Configuration

### Guest Message Limit

The default guest message limit is **6 messages** before prompting for upgrade.

To change this limit, modify the constant in the hook:

```typescript
const GUEST_MESSAGE_LIMIT = 6; // Change this value
```

### Upgrade Prompt Behavior

The upgrade prompt callback is fired only once per session when the limit is reached:

```typescript
const { onUpgradePrompt } = useGuestChat({
  onUpgradePrompt: () => {
    // This fires exactly once when guestMessageCount >= 6
    showUpgradeModal();
  },
});
```

## Error Handling

The hook gracefully handles storage errors:

- **localStorage quota exceeded**: Updates state, logs error, skips persistence
- **Corrupted stored data**: Skips corrupted items, initializes with defaults
- **Missing window object**: Safe for SSR, skips localStorage access

All errors are logged to console but don't break functionality.

```typescript
// These operations won't throw errors:
addGuestMessage(msg);        // Updates state even if localStorage fails
loadGuestMessages();          // Continues with empty state if parse fails
saveGuestConversation(conv);  // Updates state even if storage fails
```

## Performance Considerations

### Re-renders

The hook only causes re-renders when:
1. Messages change (new message added)
2. Message count changes
3. Conversation changes
4. Guest status changes

Individual operations like `loadGuestMessages()` don't trigger re-renders.

### localStorage Access

- Storage writes are batched per operation (one write per message, not multiple)
- Storage reads happen only on mount (via `loadGuestMessages()`)
- Safe try/catch blocks prevent blocking operations

## Testing

The hook includes comprehensive test coverage in `__tests__/useGuestChat.test.ts`:

```bash
# Run tests
pnpm --filter @anplexa/companions test useGuestChat

# Run with UI
pnpm --filter @anplexa/companions test --ui
```

### Test Coverage

- ✅ Guest detection
- ✅ Message management (add, load, clear)
- ✅ Message persistence
- ✅ Message counting
- ✅ Upgrade prompts
- ✅ Conversation management
- ✅ Error handling (quota, corrupt data, missing window)
- ✅ SSR compatibility
- ✅ End-to-end workflows

## Browser Compatibility

Works in all modern browsers with localStorage support:

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)
- ⚠️ IE 11 (localStorage works, but needs polyfills for Date handling)

## Migration Guide

### Updating from Direct localStorage Usage

**Before:**
```typescript
const guestMessages = JSON.parse(
  localStorage.getItem('messages') || '[]'
);

localStorage.setItem('messages', JSON.stringify([...guestMessages, msg]));
```

**After:**
```typescript
const { guestMessages, addGuestMessage } = useGuestChat({ userId });

addGuestMessage(msg);
```

## Related Hooks

- **usePreferences**: Manage user preferences
- **useUpgradeModal**: Handle upgrade modal state
- **useMessagePersistence**: Alternative persistence strategy

## Troubleshooting

### Messages Not Persisting

**Problem**: Messages disappear after page reload

**Solution**: Ensure `loadGuestMessages()` is called on mount:
```typescript
useEffect(() => {
  if (isGuest) {
    loadGuestMessages();
  }
}, [isGuest, loadGuestMessages]);
```

### Upgrade Prompt Not Showing

**Problem**: Callback never fires when limit is reached

**Solution**: Ensure callback is provided and user is guest:
```typescript
const { shouldPromptUpgrade } = useGuestChat({
  userId: undefined, // Must be undefined for guest
  onUpgradePrompt: () => { /* must be defined */ },
});

// Verify: shouldPromptUpgrade should be true at limit
```

### localStorage Quota Exceeded

**Problem**: Messages stop persisting, console shows quota error

**Solution**: Clear old guest data or request more storage:
```typescript
// Clear guest messages
const { clearGuestMessages } = useGuestChat({});
clearGuestMessages();

// Or use sessionStorage instead (not persisted):
// Modify storage service to use sessionStorage
```

## Best Practices

1. **Always provide userId**: Helps distinguish guests from authenticated users
2. **Handle upgrade callback**: Provide a way to prompt users to upgrade
3. **Clear on logout**: Manually call `clearGuestMessages()` on logout if needed
4. **Load on mount**: Call `loadGuestMessages()` in an effect during initialization
5. **Show message limit indicator**: Display remaining guest messages to users
6. **Test persistence**: Verify messages load after page reload

## Contributing

To improve this hook:

1. Add test cases in `__tests__/useGuestChat.test.ts`
2. Update this documentation
3. Consider backwards compatibility
4. Submit PR with description

## License

MIT - Part of Anplexa project
