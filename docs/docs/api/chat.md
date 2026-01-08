---
sidebar_position: 2
---

# Chat API

Endpoints for AI chat functionality with Server-Sent Events (SSE) streaming.

## Overview

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/chat` | POST | Optional | Send message (SSE stream) |
| `/api/chat/config` | GET | No | Get companion settings |
| `/api/chat/models` | GET | Admin | List available AI models |
| `/api/chat/feedback` | POST | Access Token | Submit response feedback |

---

## Send Message

Send a message and receive a streaming AI response.

```
POST /api/chat
```

### Headers

```
Authorization: Bearer {accessToken}  (optional)
Content-Type: application/json
Accept: text/event-stream
```

### Request

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "preferences": {
    "responseLength": "moderate",
    "personalityMode": "creative"
  }
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | Message[] | Yes | Conversation history |
| `messages[].role` | string | Yes | `user`, `assistant`, or `system` |
| `messages[].content` | string | Yes | Message content |
| `conversationId` | string | No | UUID of existing conversation |
| `preferences.responseLength` | string | No | `brief`, `moderate`, or `detailed` |
| `preferences.personalityMode` | string | No | Personality mode ID |

### Response (SSE Stream)

```
event: delta
data: {"content": "Hello"}

event: delta
data: {"content": "! I'm"}

event: delta
data: {"content": " doing"}

event: delta
data: {"content": " well"}

event: delta
data: {"content": "."}

event: done
data: {"messageId": "msg_123", "finishReason": "stop"}
```

### SSE Event Types

| Event | Data | Description |
|-------|------|-------------|
| `delta` | content: string | Token chunk |
| `done` | messageId, finishReason | Stream complete |
| `error` | error: string | Stream error |

### Error Responses

**400 Bad Request** (Validation error)
```json
{
  "error": "Messages array is required",
  "code": "VALIDATION_ERROR"
}
```

**401 Unauthorized** (Invalid token)
```json
{
  "error": "Invalid or expired token"
}
```

**402 Payment Required** (Credits exhausted)
```json
{
  "error": "You've reached your message limit. Please upgrade to continue.",
  "code": "CREDITS_EXHAUSTED"
}
```

**503 Service Unavailable** (AI service down)
```json
{
  "error": "AI service temporarily unavailable",
  "code": "AI_UNAVAILABLE"
}
```

---

## Guest vs Authenticated

### Guest Mode (No Authorization header)

- Uses default system prompt
- No personality customization
- No conversation persistence (client-side only)
- Message limit tracked client-side (6 messages)

### Authenticated Mode

- Personalized system prompt
- Personality mode applied
- Response length preference honored
- Conversations saved to database
- Full chat history context

---

## System Prompt Construction

The AI receives a dynamically constructed system prompt:

```
[Base companion prompt]

User's preferred name: {chatName}
Response length preference: {responseLength}

[Length-specific instructions]
- brief: Keep responses concise, 1-2 sentences
- moderate: Provide balanced responses
- detailed: Give thorough, expansive responses

[Personality mode prompt (if selected)]
```

---

## Get Companion Config

Get the current companion configuration (public settings only).

```
GET /api/chat/config
```

### Response

**200 OK**
```json
{
  "name": "Anplexa",
  "greeting": "Hey there! What's on your mind?",
  "personalityModes": [
    {
      "id": "default",
      "name": "Default",
      "description": "Balanced and friendly"
    },
    {
      "id": "creative",
      "name": "Creative",
      "description": "Playful and imaginative"
    },
    {
      "id": "thoughtful",
      "name": "Thoughtful",
      "description": "Deep and reflective"
    }
  ],
  "responseLengths": ["brief", "moderate", "detailed"],
  "defaultResponseLength": "moderate"
}
```

---

## List Available Models

List AI models available for chat. **Admin only.**

```
GET /api/chat/models
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Response

**200 OK**
```json
{
  "models": [
    {
      "id": "darkplanet-general",
      "name": "DarkPlanet General",
      "description": "General purpose conversational model",
      "isDefault": true
    },
    {
      "id": "dolphin-mixtral",
      "name": "Dolphin Mixtral",
      "description": "Long-form responses",
      "isDefault": false
    }
  ]
}
```

**403 Forbidden** (Not admin)
```json
{
  "error": "Admin access required"
}
```

---

## Submit Feedback

Submit feedback on an AI response.

```
POST /api/chat/feedback
```

### Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Request

```json
{
  "messageId": "msg_123",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "rating": "positive",
  "comment": "Great response!"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messageId` | string | Yes | ID of the message |
| `conversationId` | string | Yes | UUID of conversation |
| `rating` | string | Yes | `positive` or `negative` |
| `comment` | string | No | Optional feedback text |

### Response

**201 Created**
```json
{
  "message": "Feedback submitted successfully"
}
```

---

## AI SDK Integration

### Client-Side (AI SDK v5)

```typescript
import { useChat } from '@ai-sdk/react';

function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      conversationId,
      preferences: {
        responseLength: 'moderate',
      },
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <input value={input} onChange={handleInputChange} />
      <button type="submit" disabled={isLoading}>Send</button>
    </form>
  );
}
```

### Custom Transport

```typescript
const transport = new DefaultChatTransport({
  api: '/api/chat',
  headers: () => ({
    Authorization: `Bearer ${accessToken}`,
  }),
  body: () => ({
    conversationId,
    preferences: preferencesRef.current,
  }),
});
```

---

## Performance

| Metric | Target | Typical |
|--------|--------|---------|
| Time to first token | < 500ms | ~800ms |
| Token throughput | 30 tokens/sec | ~25 tokens/sec |
| Max response length | 2048 tokens | - |
| Stream timeout | 60 seconds | - |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `UNAUTHORIZED` | 401 | Invalid or missing token |
| `CREDITS_EXHAUSTED` | 402 | Message limit reached |
| `AI_UNAVAILABLE` | 503 | Ollama service down |
| `STREAM_ERROR` | 500 | Stream processing error |
