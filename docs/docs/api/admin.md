---
sidebar_position: 6
---

# Admin API

Endpoints for system administration, companion configuration, and user management.

:::warning Admin Access Required
All endpoints in this section (except `/api/health`) require admin privileges. The authenticated user must have `isAdmin: true` in their JWT token.
:::

## Overview

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/companion` | GET | Admin | Get companion configuration |
| `/api/admin/companion` | PUT | Admin | Update companion configuration |
| `/api/admin/users` | GET | Admin | List all users |
| `/api/admin/users/:id` | GET | Admin | Get specific user |
| `/api/admin/users/:id` | PUT | Admin | Update user |
| `/api/admin/system-prompt` | PUT | Admin | Update system prompt |
| `/api/admin/test-ollama` | POST | Admin | Test Ollama connection |
| `/api/health` | GET | No | Health check |

---

## Get Companion Configuration

Retrieve the full companion configuration including system prompt, personalities, token limits, and model settings.

```
GET /api/admin/companion
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Response

**200 OK**
```json
{
  "systemPrompt": "You are a thoughtful AI companion named Aria...",
  "personalities": [
    {
      "id": "default",
      "name": "Default",
      "description": "Balanced and friendly conversation",
      "emoji": "💬",
      "promptModifier": "",
      "isDefault": true
    },
    {
      "id": "playful",
      "name": "Playful",
      "description": "Fun, flirty, and lighthearted",
      "emoji": "😊",
      "promptModifier": "Be more playful, use humor, and keep the tone light.",
      "isDefault": false
    },
    {
      "id": "creative",
      "name": "Creative",
      "description": "Imaginative and expressive",
      "emoji": "✨",
      "promptModifier": "Be more creative and imaginative in responses.",
      "isDefault": false
    },
    {
      "id": "thoughtful",
      "name": "Thoughtful",
      "description": "Deep, reflective conversations",
      "emoji": "🌙",
      "promptModifier": "Focus on deeper, more meaningful exchanges.",
      "isDefault": false
    },
    {
      "id": "supportive",
      "name": "Supportive",
      "description": "Understanding and validating",
      "emoji": "💜",
      "promptModifier": "Be especially empathetic and supportive.",
      "isDefault": false
    }
  ],
  "tokenLimits": {
    "brief": 100,
    "moderate": 300,
    "detailed": 800,
    "maxContext": 4096
  },
  "modelSettings": {
    "model": "llama3.2",
    "temperature": 0.7,
    "topP": 0.9,
    "frequencyPenalty": 0.0,
    "presencePenalty": 0.0
  },
  "companionName": "Aria",
  "welcomeMessage": "Hello! I'm Aria, your AI companion. How are you feeling today?",
  "updatedAt": "2025-01-08T12:00:00.000Z",
  "updatedBy": "admin@example.com"
}
```

**403 Forbidden**
```json
{
  "error": "Admin access required",
  "code": "FORBIDDEN"
}
```

---

## Update Companion Configuration

Update the companion configuration. Partial updates are supported.

```
PUT /api/admin/companion
```

### Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Request

```json
{
  "systemPrompt": "You are a caring AI companion named Aria...",
  "personalities": [
    {
      "id": "playful",
      "name": "Playful",
      "description": "Fun and lighthearted",
      "emoji": "😊",
      "promptModifier": "Be more playful and use humor.",
      "isDefault": false
    }
  ],
  "tokenLimits": {
    "brief": 100,
    "moderate": 300,
    "detailed": 800
  },
  "modelSettings": {
    "temperature": 0.8
  },
  "companionName": "Aria",
  "welcomeMessage": "Hi there! I'm Aria. What's on your mind?"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `systemPrompt` | string | No | Base system prompt for the AI |
| `personalities` | array | No | List of personality mode configurations |
| `tokenLimits` | object | No | Response length token limits |
| `modelSettings` | object | No | LLM model parameters |
| `companionName` | string | No | Display name for the companion |
| `welcomeMessage` | string | No | Initial greeting message |

### Personality Object Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `name` | string | Yes | Display name |
| `description` | string | Yes | User-facing description |
| `emoji` | string | Yes | Icon emoji |
| `promptModifier` | string | No | Additional prompt instructions |
| `isDefault` | boolean | No | Whether this is the default mode |

### Token Limits Object Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `brief` | number | No | Max tokens for brief responses |
| `moderate` | number | No | Max tokens for moderate responses |
| `detailed` | number | No | Max tokens for detailed responses |
| `maxContext` | number | No | Maximum context window size |

### Model Settings Object Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | No | Model name (e.g., `llama3.2`, `mistral`) |
| `temperature` | number | No | Sampling temperature (0.0-2.0) |
| `topP` | number | No | Nucleus sampling parameter |
| `frequencyPenalty` | number | No | Frequency penalty (-2.0 to 2.0) |
| `presencePenalty` | number | No | Presence penalty (-2.0 to 2.0) |

### Response

**200 OK**
```json
{
  "message": "Companion configuration updated",
  "config": {
    "systemPrompt": "You are a caring AI companion named Aria...",
    "personalities": [...],
    "tokenLimits": {
      "brief": 100,
      "moderate": 300,
      "detailed": 800,
      "maxContext": 4096
    },
    "modelSettings": {
      "model": "llama3.2",
      "temperature": 0.8,
      "topP": 0.9,
      "frequencyPenalty": 0.0,
      "presencePenalty": 0.0
    },
    "companionName": "Aria",
    "welcomeMessage": "Hi there! I'm Aria. What's on your mind?",
    "updatedAt": "2025-01-08T14:30:00.000Z",
    "updatedBy": "admin@example.com"
  }
}
```

**400 Bad Request**
```json
{
  "error": "Invalid temperature value. Must be between 0.0 and 2.0",
  "code": "VALIDATION_ERROR"
}
```

**403 Forbidden**
```json
{
  "error": "Admin access required",
  "code": "FORBIDDEN"
}
```

---

## List Users

Get a paginated list of all registered users.

```
GET /api/admin/users
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Users per page (max 100) |
| `search` | string | - | Search by email or chatName |
| `status` | string | - | Filter by subscription status |
| `sortBy` | string | `createdAt` | Sort field |
| `sortOrder` | string | `desc` | Sort order (`asc` or `desc`) |

### Response

**200 OK**
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "isAdmin": false,
      "chatName": "Friend",
      "gender": "neutral",
      "personalityMode": "creative",
      "subscriptionStatus": "active",
      "responseLength": "moderate",
      "createdAt": "2025-01-08T12:00:00.000Z",
      "lastLoginAt": "2025-01-08T14:30:00.000Z",
      "messageCount": 142
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "email": "another@example.com",
      "isAdmin": false,
      "chatName": "Alex",
      "gender": "male",
      "personalityMode": "thoughtful",
      "subscriptionStatus": "inactive",
      "responseLength": "detailed",
      "createdAt": "2025-01-05T09:00:00.000Z",
      "lastLoginAt": "2025-01-07T18:45:00.000Z",
      "messageCount": 87
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

**403 Forbidden**
```json
{
  "error": "Admin access required",
  "code": "FORBIDDEN"
}
```

---

## Get User

Get detailed information for a specific user.

```
GET /api/admin/users/:id
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | User ID |

### Response

**200 OK**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "isAdmin": false,
  "chatName": "Friend",
  "gender": "neutral",
  "personalityMode": "creative",
  "subscriptionStatus": "active",
  "stripeCustomerId": "cus_ABC123",
  "responseLength": "moderate",
  "theme": "dark",
  "storagePreference": "cloud",
  "notifications": {
    "email": true,
    "push": false
  },
  "createdAt": "2025-01-08T12:00:00.000Z",
  "lastLoginAt": "2025-01-08T14:30:00.000Z",
  "messageCount": 142,
  "conversationCount": 12,
  "sessions": [
    {
      "id": "session-123",
      "createdAt": "2025-01-08T14:30:00.000Z",
      "lastActiveAt": "2025-01-08T15:45:00.000Z",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

**404 Not Found**
```json
{
  "error": "User not found",
  "code": "NOT_FOUND"
}
```

**403 Forbidden**
```json
{
  "error": "Admin access required",
  "code": "FORBIDDEN"
}
```

---

## Update User

Update a user's profile and settings.

```
PUT /api/admin/users/:id
```

### Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | User ID |

### Request

```json
{
  "isAdmin": false,
  "subscriptionStatus": "active",
  "chatName": "Updated Name",
  "personalityMode": "default"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isAdmin` | boolean | No | Grant/revoke admin privileges |
| `subscriptionStatus` | string | No | `active`, `inactive`, `cancelled` |
| `chatName` | string | No | Display name for the user |
| `gender` | string | No | `male`, `female`, `neutral` |
| `personalityMode` | string | No | Active personality mode ID |
| `responseLength` | string | No | `brief`, `moderate`, `detailed` |

### Response

**200 OK**
```json
{
  "message": "User updated",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "isAdmin": false,
    "chatName": "Updated Name",
    "subscriptionStatus": "active",
    "personalityMode": "default",
    "updatedAt": "2025-01-08T15:00:00.000Z"
  }
}
```

**400 Bad Request**
```json
{
  "error": "Invalid subscriptionStatus. Must be active, inactive, or cancelled.",
  "code": "VALIDATION_ERROR"
}
```

**404 Not Found**
```json
{
  "error": "User not found",
  "code": "NOT_FOUND"
}
```

**403 Forbidden**
```json
{
  "error": "Admin access required",
  "code": "FORBIDDEN"
}
```

:::warning Self-Admin Removal
Admins cannot remove their own admin privileges. Another admin must perform this action.
:::

---

## Update System Prompt

Update only the system prompt without affecting other configuration.

```
PUT /api/admin/system-prompt
```

### Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Request

```json
{
  "systemPrompt": "You are Aria, a warm and empathetic AI companion. You remember previous conversations and build genuine connections with users. Always be supportive, curious, and authentic."
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `systemPrompt` | string | Yes | The new system prompt (min 10 chars, max 10000 chars) |

### Response

**200 OK**
```json
{
  "message": "System prompt updated",
  "systemPrompt": "You are Aria, a warm and empathetic AI companion...",
  "updatedAt": "2025-01-08T15:30:00.000Z",
  "updatedBy": "admin@example.com"
}
```

**400 Bad Request**
```json
{
  "error": "System prompt must be between 10 and 10000 characters",
  "code": "VALIDATION_ERROR"
}
```

**403 Forbidden**
```json
{
  "error": "Admin access required",
  "code": "FORBIDDEN"
}
```

---

## Test Ollama Connection

Test the connection to the Ollama LLM backend.

```
POST /api/admin/test-ollama
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Request

Optional. If no body is provided, uses the configured Ollama settings.

```json
{
  "baseUrl": "http://localhost:11434",
  "model": "llama3.2"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `baseUrl` | string | No | Ollama server URL to test |
| `model` | string | No | Model to test (defaults to configured model) |

### Response

**200 OK**
```json
{
  "status": "connected",
  "model": "llama3.2",
  "ollamaVersion": "0.1.42",
  "availableModels": [
    "llama3.2",
    "llama3.2:70b",
    "mistral",
    "codellama"
  ],
  "testResponse": "Hello! I'm ready to assist you.",
  "latencyMs": 245
}
```

**503 Service Unavailable**
```json
{
  "status": "disconnected",
  "error": "Failed to connect to Ollama server",
  "details": "Connection refused: http://localhost:11434",
  "code": "OLLAMA_UNAVAILABLE"
}
```

**400 Bad Request**
```json
{
  "status": "error",
  "error": "Model not found",
  "details": "Model 'llama4' is not available on this Ollama instance",
  "code": "MODEL_NOT_FOUND"
}
```

**403 Forbidden**
```json
{
  "error": "Admin access required",
  "code": "FORBIDDEN"
}
```

---

## Health Check

Check the health status of the API. **No authentication required.**

```
GET /api/health
```

### Response

**200 OK**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-01-08T15:45:00.000Z",
  "services": {
    "database": "connected",
    "ollama": "connected",
    "redis": "connected"
  },
  "uptime": 86400
}
```

**503 Service Unavailable**
```json
{
  "status": "degraded",
  "version": "1.0.0",
  "timestamp": "2025-01-08T15:45:00.000Z",
  "services": {
    "database": "connected",
    "ollama": "disconnected",
    "redis": "connected"
  },
  "uptime": 86400
}
```

---

## Companion Configuration Object

```typescript
interface CompanionConfig {
  // Core identity
  systemPrompt: string;
  companionName: string;
  welcomeMessage: string;

  // Personality modes
  personalities: Personality[];

  // Response settings
  tokenLimits: {
    brief: number;
    moderate: number;
    detailed: number;
    maxContext: number;
  };

  // Model configuration
  modelSettings: {
    model: string;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };

  // Metadata
  updatedAt: string;
  updatedBy: string;
}

interface Personality {
  id: string;
  name: string;
  description: string;
  emoji: string;
  promptModifier: string;
  isDefault: boolean;
}
```

---

## User Object

```typescript
interface User {
  id: string;
  email: string;
  isAdmin: boolean;

  // Profile
  chatName: string | null;
  gender: 'male' | 'female' | 'neutral';

  // Preferences
  personalityMode: string;
  responseLength: 'brief' | 'moderate' | 'detailed';
  theme: 'light' | 'dark' | 'system';
  storagePreference: 'cloud' | 'local';

  // Subscription
  subscriptionStatus: 'active' | 'inactive' | 'cancelled';
  stripeCustomerId: string | null;

  // Notifications
  notifications: {
    email: boolean;
    push: boolean;
  };

  // Timestamps
  createdAt: string;
  lastLoginAt: string | null;

  // Stats (admin view only)
  messageCount?: number;
  conversationCount?: number;
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `FORBIDDEN` | 403 | User is not an admin |
| `NOT_FOUND` | 404 | Requested resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `OLLAMA_UNAVAILABLE` | 503 | Cannot connect to Ollama |
| `MODEL_NOT_FOUND` | 400 | Specified model not available |

---

## Admin Role Requirements

To access admin endpoints, the user's JWT token must contain:

```json
{
  "sub": "user-id",
  "email": "admin@example.com",
  "isAdmin": true,
  "type": "access"
}
```

Users without `isAdmin: true` will receive a `403 Forbidden` response on all admin endpoints.

### Granting Admin Access

Admin privileges can only be granted by:
1. Another admin using the `PUT /api/admin/users/:id` endpoint
2. Direct database modification by a system administrator

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `GET /api/admin/*` | 100 requests | 1 minute |
| `PUT /api/admin/*` | 30 requests | 1 minute |
| `POST /api/admin/test-ollama` | 10 requests | 1 minute |
| `GET /api/health` | 60 requests | 1 minute |
