---
sidebar_position: 4
---

# Settings API

Endpoints for managing user preferences and settings.

## Overview

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/settings` | GET | Access Token | Get user preferences |
| `/api/settings` | PUT | Access Token | Update preferences |
| `/api/settings/theme` | PUT | Access Token | Update theme only |
| `/api/personality-modes` | GET | No | List personality modes |

---

## Get Settings

Get the current user's preferences.

```
GET /api/settings
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Response

**200 OK**
```json
{
  "gender": "neutral",
  "chatName": "Friend",
  "responseLength": "moderate",
  "personalityMode": "creative",
  "theme": "dark",
  "storagePreference": "cloud",
  "notifications": {
    "email": true,
    "push": false
  }
}
```

---

## Update Settings

Update user preferences.

```
PUT /api/settings
```

### Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Request

```json
{
  "gender": "female",
  "chatName": "Alex",
  "responseLength": "detailed",
  "personalityMode": "thoughtful",
  "storagePreference": "local"
}
```

### Request Schema

| Field | Type | Required | Values | Description |
|-------|------|----------|--------|-------------|
| `gender` | string | No | `male`, `female`, `neutral` | User's gender preference |
| `chatName` | string | No | max 50 chars | Name AI uses for user |
| `responseLength` | string | No | `brief`, `moderate`, `detailed` | Response length preference |
| `personalityMode` | string | No | mode ID | Active personality mode |
| `storagePreference` | string | No | `cloud`, `local` | Where to store conversations |

### Response

**200 OK**
```json
{
  "gender": "female",
  "chatName": "Alex",
  "responseLength": "detailed",
  "personalityMode": "thoughtful",
  "theme": "dark",
  "storagePreference": "local",
  "notifications": {
    "email": true,
    "push": false
  }
}
```

**400 Bad Request** (Validation error)
```json
{
  "error": "Invalid responseLength. Must be brief, moderate, or detailed."
}
```

---

## Update Theme

Update only the theme setting (lightweight endpoint).

```
PUT /api/settings/theme
```

### Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Request

```json
{
  "theme": "light"
}
```

### Request Schema

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `theme` | string | Yes | `light`, `dark`, `system` |

### Response

**200 OK**
```json
{
  "theme": "light"
}
```

---

## List Personality Modes

Get available personality modes. **No authentication required.**

```
GET /api/personality-modes
```

### Response

**200 OK**
```json
{
  "modes": [
    {
      "id": "default",
      "name": "Default",
      "description": "Balanced and friendly conversation",
      "emoji": "💬",
      "isDefault": true
    },
    {
      "id": "playful",
      "name": "Playful",
      "description": "Fun, flirty, and lighthearted",
      "emoji": "😊",
      "isDefault": false
    },
    {
      "id": "creative",
      "name": "Creative",
      "description": "Imaginative and expressive",
      "emoji": "✨",
      "isDefault": false
    },
    {
      "id": "thoughtful",
      "name": "Thoughtful",
      "description": "Deep, reflective conversations",
      "emoji": "🌙",
      "isDefault": false
    },
    {
      "id": "supportive",
      "name": "Supportive",
      "description": "Understanding and validating",
      "emoji": "💜",
      "isDefault": false
    }
  ]
}
```

---

## Settings Object

```typescript
interface UserSettings {
  // Identity
  gender: 'male' | 'female' | 'neutral';
  chatName: string;

  // Chat preferences
  responseLength: 'brief' | 'moderate' | 'detailed';
  personalityMode: string | null;

  // App preferences
  theme: 'light' | 'dark' | 'system';
  storagePreference: 'cloud' | 'local';

  // Notifications
  notifications: {
    email: boolean;
    push: boolean;
  };
}
```

---

## Response Length Behavior

| Setting | Description | Token Limit |
|---------|-------------|-------------|
| `brief` | Concise, 1-2 sentences | ~100 tokens |
| `moderate` | Balanced responses | ~300 tokens |
| `detailed` | Thorough, expansive | ~800 tokens |

---

## Storage Preference

| Setting | Behavior |
|---------|----------|
| `cloud` | Conversations stored in database, synced across devices |
| `local` | Conversations stored in localStorage only (no sync) |

---

## Default Values

| Setting | Default |
|---------|---------|
| `gender` | `neutral` |
| `chatName` | `null` (AI uses generic terms) |
| `responseLength` | `moderate` |
| `personalityMode` | `default` |
| `theme` | `dark` |
| `storagePreference` | `cloud` |
