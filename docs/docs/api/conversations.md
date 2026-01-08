---
sidebar_position: 3
---

# Conversations API

Endpoints for managing chat conversations and messages.

## Overview

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/conversations` | GET | Access Token | List user conversations |
| `/api/conversations` | POST | Access Token | Create new conversation |
| `/api/conversations/:id` | GET | Access Token | Get conversation details |
| `/api/conversations/:id/messages` | GET | Access Token | Get messages (paginated) |
| `/api/conversations/:id` | PUT | Access Token | Update conversation |
| `/api/conversations/:id` | DELETE | Access Token | Delete conversation |
| `/api/conversations/:id/clear` | POST | Access Token | Clear messages |

---

## List Conversations

Get all conversations for the authenticated user.

```
GET /api/conversations
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Max conversations to return |
| `offset` | number | 0 | Pagination offset |
| `sort` | string | `updatedAt` | Sort field (`createdAt`, `updatedAt`) |
| `order` | string | `desc` | Sort order (`asc`, `desc`) |

### Response

**200 OK**
```json
{
  "conversations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Hello conversation",
      "messageCount": 12,
      "lastMessageAt": "2025-01-08T14:30:00.000Z",
      "createdAt": "2025-01-08T10:00:00.000Z",
      "updatedAt": "2025-01-08T14:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Creative writing",
      "messageCount": 24,
      "lastMessageAt": "2025-01-07T22:15:00.000Z",
      "createdAt": "2025-01-07T20:00:00.000Z",
      "updatedAt": "2025-01-07T22:15:00.000Z"
    }
  ],
  "total": 15,
  "hasMore": true
}
```

---

## Create Conversation

Create a new conversation.

```
POST /api/conversations
```

### Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Request

```json
{
  "title": "New conversation",
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    },
    {
      "role": "assistant",
      "content": "Hi there! How can I help you today?"
    }
  ]
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Conversation title (auto-generated if not provided) |
| `messages` | Message[] | No | Initial messages |

### Response

**201 Created**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "title": "New conversation",
  "messageCount": 2,
  "createdAt": "2025-01-08T15:00:00.000Z",
  "updatedAt": "2025-01-08T15:00:00.000Z"
}
```

---

## Get Conversation

Get a specific conversation with metadata.

```
GET /api/conversations/:id
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Response

**200 OK**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Hello conversation",
  "messageCount": 12,
  "createdAt": "2025-01-08T10:00:00.000Z",
  "updatedAt": "2025-01-08T14:30:00.000Z"
}
```

**404 Not Found**
```json
{
  "error": "Conversation not found"
}
```

**403 Forbidden** (Not owner)
```json
{
  "error": "Access denied"
}
```

---

## Get Messages

Get messages for a conversation with pagination.

```
GET /api/conversations/:id/messages
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Max messages to return |
| `before` | string | - | Get messages before this message ID |
| `after` | string | - | Get messages after this message ID |

### Response

**200 OK**
```json
{
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "Hello!",
      "createdAt": "2025-01-08T10:00:00.000Z"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "Hi there! How can I help you today?",
      "createdAt": "2025-01-08T10:00:05.000Z"
    },
    {
      "id": "msg_003",
      "role": "user",
      "content": "I'd like to talk about something on my mind.",
      "createdAt": "2025-01-08T10:01:00.000Z"
    }
  ],
  "hasMore": true,
  "nextCursor": "msg_003"
}
```

---

## Update Conversation

Update conversation title or save messages.

```
PUT /api/conversations/:id
```

### Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Request

```json
{
  "title": "Updated title",
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "Hello!",
      "createdAt": "2025-01-08T10:00:00.000Z"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "Hi there! How can I help you today?",
      "createdAt": "2025-01-08T10:00:05.000Z"
    }
  ]
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | New title |
| `messages` | Message[] | No | Complete message list |

### Response

**200 OK**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Updated title",
  "messageCount": 2,
  "updatedAt": "2025-01-08T15:30:00.000Z"
}
```

---

## Delete Conversation

Permanently delete a conversation and all its messages.

```
DELETE /api/conversations/:id
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Response

**200 OK**
```json
{
  "message": "Conversation deleted"
}
```

**404 Not Found**
```json
{
  "error": "Conversation not found"
}
```

---

## Clear Messages

Remove all messages from a conversation while keeping the conversation.

```
POST /api/conversations/:id/clear
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Response

**200 OK**
```json
{
  "message": "Messages cleared",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Message Object

```typescript
interface Message {
  id: string;           // UUID or client-generated ID
  role: 'user' | 'assistant' | 'system';
  content: string;      // Message text
  createdAt: string;    // ISO 8601 timestamp
}
```

---

## Auto-Generated Titles

When creating a conversation without a title, the backend generates one from the first user message:

1. Takes first 50 characters of first user message
2. Truncates at word boundary
3. Adds ellipsis if truncated

Example:
- Input: `"I've been thinking a lot about my career choices lately and wondering if I should make a change."`
- Generated: `"I've been thinking a lot about my career..."`

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Conversation doesn't exist |
| `FORBIDDEN` | 403 | User doesn't own conversation |
| `VALIDATION_ERROR` | 400 | Invalid request body |
