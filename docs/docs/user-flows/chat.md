---
sidebar_position: 2
---

# Chat Flow

Detailed sequence diagrams for the AI chat functionality.

## Send Message (Authenticated)

Standard chat flow for logged-in users.

```mermaid
sequenceDiagram
    actor User
    participant UI as ChatInterface
    participant Hook as useChat Hook
    participant API as /api/chat
    participant Backend as Backend API
    participant DB as Database
    participant Ollama as Ollama LLM

    User->>UI: Type message
    User->>UI: Press Enter / Click Send

    UI->>UI: Add message to local state
    UI->>UI: Show "thinking" indicator

    UI->>Hook: append(userMessage)
    Hook->>API: POST /api/chat

    Note over Hook,API: Request Body
    Note over Hook,API: { messages, conversationId, preferences }

    API->>API: Validate request (Zod)
    API->>API: Extract auth token
    API->>Backend: POST /api/chat
    Note over API,Backend: Authorization: Bearer {token}

    Backend->>Backend: Verify JWT
    Backend->>DB: Load user preferences
    DB-->>Backend: { personalityMode, responseLength, gender }

    Backend->>DB: Load companion config
    DB-->>Backend: { systemPrompt, personalities }

    Backend->>Backend: Build system prompt
    Note over Backend: Combine base prompt + user prefs + personality

    Backend->>Ollama: POST /api/chat (stream: true)
    Note over Backend,Ollama: Model: configured model
    Note over Backend,Ollama: Temperature: based on personality

    loop SSE Stream
        Ollama-->>Backend: Token chunk
        Backend-->>API: SSE event (delta)
        API->>API: Transform to AI SDK format
        API-->>Hook: SSE event
        Hook->>UI: Update message content
        UI->>UI: Render progressive response
    end

    Ollama-->>Backend: Stream complete
    Backend-->>API: SSE event (done)
    API-->>Hook: Stream end
    Hook->>UI: Mark message complete

    UI->>UI: Hide "thinking" indicator

    Note over User,DB: Auto-save conversation

    UI->>API: PUT /api/conversations/{id}
    API->>Backend: PUT /api/conversations/{id}
    Backend->>DB: UPDATE conversation
    Backend-->>API: 200 OK
    API-->>UI: Saved
```

## Send Message (Guest Mode)

Chat flow for unauthenticated users with message limits.

```mermaid
sequenceDiagram
    actor User
    participant UI as ChatInterface
    participant Storage as localStorage
    participant Hook as useChat Hook
    participant API as /api/chat
    participant Backend as Backend API

    User->>UI: Type message
    User->>UI: Press Enter

    UI->>Storage: Get guestMessageCount
    Storage-->>UI: count (e.g., 4)

    alt Count >= 6 (limit reached)
        UI->>UI: Show upgrade modal
        Note over UI: "You've reached your free message limit"
    else Count < 6
        UI->>UI: Add message to local state
        UI->>Storage: Increment guestMessageCount

        UI->>Hook: append(userMessage)
        Hook->>API: POST /api/chat
        Note over Hook,API: No Authorization header

        API->>Backend: POST /api/chat
        Note over API,Backend: No auth = guest user

        Backend->>Backend: Use default system prompt
        Backend->>Backend: No personality customization

        loop SSE Stream
            Backend-->>API: Token chunk
            API-->>Hook: SSE event
            Hook->>UI: Update response
        end

        API-->>Hook: Stream complete
        Hook->>UI: Message done

        Note over UI: Save to localStorage only

        UI->>Storage: Save conversation
        Storage-->>UI: Saved locally

        alt Count === 5 (last free message)
            UI->>UI: Show "1 message remaining" warning
        end
    end
```

## Conversation Management

### Load Conversations

```mermaid
sequenceDiagram
    actor User
    participant UI as ChatInterface
    participant Service as ConversationService
    participant API as /api/conversations
    participant Backend as Backend API
    participant DB as Database
    participant Storage as localStorage

    User->>UI: Open chat page

    UI->>Service: getConversations()
    Service->>API: GET /api/conversations

    API->>Backend: GET /api/conversations
    Backend->>DB: SELECT conversations WHERE userId
    DB-->>Backend: Conversation list

    Backend-->>API: 200 { conversations }
    API-->>Service: Conversations array
    Service-->>UI: Display conversation list

    Note over UI: Fallback for offline

    alt API fails
        Service->>Storage: Get cached conversations
        Storage-->>Service: Cached data
        Service-->>UI: Show cached (with warning)
    end
```

### Create New Conversation

```mermaid
sequenceDiagram
    actor User
    participant UI as ChatInterface
    participant Service as ConversationService
    participant API as /api/conversations
    participant Backend as Backend API
    participant DB as Database

    User->>UI: Click "New Chat"

    UI->>UI: Clear current messages
    UI->>UI: Generate temp ID

    User->>UI: Send first message
    UI->>UI: Show response

    Note over UI: Auto-create on first save

    UI->>Service: saveConversation(messages)

    alt No conversation ID
        Service->>API: POST /api/conversations
        API->>Backend: POST /api/conversations

        Backend->>Backend: Generate title from first message
        Backend->>DB: INSERT conversation
        DB-->>Backend: New conversation

        Backend-->>API: 201 { id, title }
        API-->>Service: Conversation created
        Service->>Service: Store conversation ID
    end

    Service->>API: PUT /api/conversations/{id}
    API->>Backend: PUT /api/conversations/{id}
    Backend->>DB: UPDATE messages
    Backend-->>API: 200 OK
    API-->>Service: Saved
    Service-->>UI: Conversation saved
```

### Delete Conversation

```mermaid
sequenceDiagram
    actor User
    participant UI as ChatInterface
    participant Service as ConversationService
    participant API as /api/conversations
    participant Backend as Backend API
    participant DB as Database

    User->>UI: Click delete on conversation

    UI->>UI: Show confirmation dialog
    User->>UI: Confirm delete

    UI->>Service: deleteConversation(id)
    Service->>API: DELETE /api/conversations/{id}

    API->>Backend: DELETE /api/conversations/{id}
    Backend->>DB: DELETE conversation
    Backend->>DB: DELETE related messages
    DB-->>Backend: Deleted

    Backend-->>API: 200 OK
    API-->>Service: Success
    Service-->>UI: Remove from list

    UI->>UI: Select next conversation (or new)
```

## Ice Breaker Flow

Pre-defined conversation starters.

```mermaid
sequenceDiagram
    actor User
    participant UI as ChatInterface
    participant Hook as useChat Hook

    Note over User,Hook: New conversation, no messages

    UI->>UI: Display ice breaker buttons
    Note over UI: "Tell me about yourself"
    Note over UI: "What are you thinking?"
    Note over UI: "I had a long day..."

    User->>UI: Click ice breaker

    UI->>UI: Hide ice breaker buttons
    UI->>UI: Add ice breaker as user message

    UI->>Hook: append(iceBreaker)
    Note over UI,Hook: Same flow as regular message

    Hook-->>UI: AI response streams
    UI->>UI: Display response
```

## Settings & Preferences

### Update Response Preferences

```mermaid
sequenceDiagram
    actor User
    participant UI as SettingsModal
    participant Context as AuthContext
    participant API as /api/settings
    participant Backend as Backend API
    participant DB as Database

    User->>UI: Open settings modal
    UI->>UI: Show current preferences

    User->>UI: Change response length
    Note over UI: Brief → Moderate → Detailed

    User->>UI: Click "Save"

    UI->>API: PUT /api/settings
    API->>Backend: PUT /api/settings

    Backend->>DB: UPDATE user_preferences
    DB-->>Backend: Updated

    Backend-->>API: 200 { preferences }
    API-->>UI: Success

    UI->>Context: Update local state
    UI->>UI: Show success toast
    UI->>UI: Close modal

    Note over User,DB: Next message uses new preference
```

### Change Personality Mode

```mermaid
sequenceDiagram
    actor User
    participant UI as ChatInterface
    participant API as /api/personality-modes
    participant Backend as Backend API
    participant DB as Database

    User->>UI: Click personality selector

    UI->>API: GET /api/personality-modes
    API->>Backend: GET /api/personality-modes
    Backend-->>API: Available modes
    API-->>UI: Show personality options

    User->>UI: Select "Creative"

    UI->>API: PUT /api/settings
    API->>Backend: PUT /api/settings
    Backend->>DB: UPDATE personalityMode
    Backend-->>API: 200 OK
    API-->>UI: Updated

    UI->>UI: Show new personality active

    Note over User,DB: AI responses now use Creative personality
```

## Error Handling

### Credit Limit Reached

```mermaid
sequenceDiagram
    actor User
    participant UI as ChatInterface
    participant Hook as useChat Hook
    participant API as /api/chat
    participant Backend as Backend API

    User->>UI: Send message
    UI->>Hook: append(message)
    Hook->>API: POST /api/chat

    API->>Backend: POST /api/chat
    Backend->>Backend: Check user credits

    Backend-->>API: 402 { error: "Credits exhausted", code: "CREDITS_EXHAUSTED" }
    API-->>Hook: 402 Payment Required
    Hook-->>UI: Error callback

    UI->>UI: Show upgrade modal
    Note over UI: "You've run out of credits!"
    Note over UI: "Upgrade to continue chatting"
```

### Network Error

```mermaid
sequenceDiagram
    actor User
    participant UI as ChatInterface
    participant Hook as useChat Hook
    participant API as /api/chat

    User->>UI: Send message
    UI->>Hook: append(message)
    Hook->>API: POST /api/chat

    API->>API: Network timeout

    API-->>Hook: Network error
    Hook-->>UI: Error callback

    UI->>UI: Show error toast
    Note over UI: "Connection error. Please try again."

    UI->>UI: Keep message in input
    Note over UI: User can retry
```

### Stream Interruption

```mermaid
sequenceDiagram
    actor User
    participant UI as ChatInterface
    participant Hook as useChat Hook
    participant API as /api/chat
    participant Backend as Backend API

    User->>UI: Send message
    UI->>Hook: append(message)
    Hook->>API: POST /api/chat

    loop Partial stream
        API-->>Hook: Token chunks
        Hook->>UI: Update response
    end

    API->>API: Connection lost

    Hook->>Hook: Detect stream error
    Hook-->>UI: onError callback

    UI->>UI: Show partial response
    UI->>UI: Show "Response interrupted" warning

    Note over UI: Partial response preserved
    Note over UI: User can regenerate
```

## SSE Stream Format

### Wire Format

```
event: delta
data: {"content": "Hello"}

event: delta
data: {"content": " there"}

event: delta
data: {"content": "!"}

event: done
data: {"messageId": "uuid-xxx", "finishReason": "stop"}
```

### AI SDK Transformation

```typescript
// Backend SSE format
// data: {"message":{"content":"token"}}

// Transformed for AI SDK v5
// data: {"type":"text-delta","textDelta":"token"}
```

## Performance Considerations

| Metric | Target | Current |
|--------|--------|---------|
| Time to first token | < 500ms | ~800ms |
| Token throughput | 30+ tokens/sec | ~25 tokens/sec |
| Message save debounce | 1 second | 1 second |
| Conversation load | < 200ms | ~150ms |

### Optimization Opportunities

1. **Streaming buffer**: Batch small tokens for smoother rendering
2. **Optimistic updates**: Show user message immediately
3. **Connection pooling**: Reuse Ollama connections
4. **Message pagination**: Lazy load old messages
