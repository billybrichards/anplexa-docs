# useGuestChat - Quick Start Guide

## 5-Minute Setup

### Import the Hook

```typescript
import { useGuestChat, type UseGuestChatReturn } from '@/hooks';
```

### Basic Usage

```typescript
export function MyChatComponent() {
  // Initialize the hook
  const {
    guestMessages,
    addGuestMessage,
    shouldPromptUpgrade,
    isGuest,
  } = useGuestChat({
    userId: user?.id,                    // undefined for guests
    onUpgradePrompt: showUpgradeModal,   // Called at 6 messages
  });

  // Handle sending a message
  const handleSendMessage = (content: string) => {
    if (!isGuest) return;

    const message: Message = {
      id: generateId(),
      conversationId: currentConversation.id,
      role: 'user',
      content,
      createdAt: new Date(),
    };

    addGuestMessage(message);
  };

  return (
    <div>
      {guestMessages.map(msg => (
        <ChatBubble key={msg.id} message={msg} />
      ))}
      {shouldPromptUpgrade && <UpgradePrompt />}
    </div>
  );
}
```

## Common Tasks

### Check if User is Guest

```typescript
const { isGuest } = useGuestChat({ userId: user?.id });

if (isGuest) {
  // Show guest-only UI
}
```

### Add a Message

```typescript
const { addGuestMessage } = useGuestChat({ userId });

addGuestMessage({
  id: 'msg-1',
  conversationId: 'conv-1',
  role: 'user',
  content: 'Hello!',
  createdAt: new Date(),
});
```

### Check Message Limit

```typescript
const { guestMessageCount, shouldPromptUpgrade } = useGuestChat({ userId });

if (guestMessageCount >= 6) {
  // Guest has reached limit
}

if (shouldPromptUpgrade) {
  // Show upgrade modal once
}
```

### Save Guest Conversation

```typescript
const { saveGuestConversation } = useGuestChat({ userId });

saveGuestConversation({
  id: 'conv-1',
  userId: 'guest',
  title: 'My Chat',
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### Load Messages on Mount

```typescript
const { loadGuestMessages, isGuest } = useGuestChat({ userId });

useEffect(() => {
  if (isGuest) {
    loadGuestMessages();
  }
}, [isGuest, loadGuestMessages]);
```

### Clear Guest Data

```typescript
const { clearGuestMessages } = useGuestChat({ userId });

// Clear on logout
const handleLogout = () => {
  clearGuestMessages();
  logout();
};
```

## Complete Example

```typescript
import { useGuestChat, type Message } from '@/hooks';
import { useState } from 'react';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);

  const {
    guestMessages,
    addGuestMessage,
    shouldPromptUpgrade,
    isGuest,
    guestMessageCount,
  } = useGuestChat({
    userId: user?.id,
    onUpgradePrompt: () => setShowUpgrade(true),
  });

  const handleSend = async () => {
    // Check if can send
    if (!isGuest) return;
    if (guestMessageCount >= 6) return;

    // Create message
    const message: Message = {
      id: `msg-${Date.now()}`,
      conversationId: 'guest-conv',
      role: 'user',
      content: input,
      createdAt: new Date(),
    };

    // Add to state and localStorage
    addGuestMessage(message);
    setInput('');

    // Get AI response...
  };

  return (
    <div className="chat">
      <div className="messages">
        {guestMessages.map(msg => (
          <div key={msg.id} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type message..."
          disabled={!isGuest}
        />
        <button onClick={handleSend} disabled={!isGuest}>
          Send ({guestMessageCount}/6)
        </button>
      </div>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          messageCount={guestMessageCount}
        />
      )}
    </div>
  );
}
```

## API at a Glance

| Method | Purpose | Returns |
|--------|---------|---------|
| `addGuestMessage(msg)` | Add and persist message | void |
| `loadGuestMessages()` | Load from localStorage | Promise<void> |
| `saveGuestConversation(conv)` | Save conversation | void |
| `clearGuestMessages()` | Clear all guest data | void |

## State at a Glance

| Property | Type | Purpose |
|----------|------|---------|
| `isGuest` | boolean | Is user not logged in? |
| `guestMessages` | Message[] | All guest messages |
| `guestMessageCount` | number | Total messages sent |
| `guestConversation` | Conversation \| null | Current conversation |
| `shouldPromptUpgrade` | boolean | Show upgrade prompt? |

## Tips

1. **Always provide userId** - Even if undefined, helps distinguish guests
2. **Handle upgrade callback** - Don't skip `onUpgradePrompt`
3. **Load on mount** - Call `loadGuestMessages()` in useEffect
4. **Check before sending** - Verify `isGuest && guestMessageCount < 6`
5. **Persist conversation** - Save conversation title after creation

## See Also

- Full docs: `USE_GUEST_CHAT.md`
- Tests: `__tests__/useGuestChat.test.ts`
- Related hooks: `useUpgradeModal`, `useMessagePersistence`
