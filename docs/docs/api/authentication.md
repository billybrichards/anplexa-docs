---
sidebar_position: 1
---

# Authentication API

Endpoints for user authentication, registration, and session management.

## Overview

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Create new account |
| `/api/auth/login` | POST | No | Authenticate user |
| `/api/auth/refresh` | POST | Refresh Token | Refresh access token |
| `/api/auth/logout` | POST | Access Token | Invalidate session |
| `/api/auth/me` | GET | Access Token | Get current user |
| `/api/auth/forgot-password` | POST | No | Request password reset |
| `/api/auth/reset-password` | POST | No | Reset password with token |
| `/api/auth/magic-link` | POST | No | Request magic link |
| `/api/auth/magic-link/verify` | POST | No | Verify magic link |
| `/api/auth/exchange-token` | POST | No | Exchange code for tokens |

---

## Register

Create a new user account.

```
POST /api/auth/register
```

### Request

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Response

**201 Created**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "isAdmin": false,
    "personalityMode": null,
    "subscriptionStatus": "inactive",
    "createdAt": "2025-01-08T12:00:00.000Z"
  }
}
```

**409 Conflict** (Email already registered)
```json
{
  "error": "Email already registered",
  "code": "EMAIL_EXISTS"
}
```

**400 Bad Request** (Validation error)
```json
{
  "error": "Invalid email format",
  "code": "VALIDATION_ERROR"
}
```

---

## Login

Authenticate with email and password.

```
POST /api/auth/login
```

### Request

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Response

**200 OK**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "isAdmin": false,
    "personalityMode": "creative",
    "subscriptionStatus": "active",
    "chatName": "Friend",
    "createdAt": "2025-01-08T12:00:00.000Z"
  }
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid credentials"
}
```

**429 Too Many Requests** (Rate limited)
```json
{
  "error": "Too many login attempts. Please try again in 15 minutes.",
  "code": "RATE_LIMITED"
}
```

### Rate Limit

- **10 attempts** per **15 minutes** per IP

---

## Refresh Token

Exchange a refresh token for a new token pair.

```
POST /api/auth/refresh
```

### Request

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Response

**200 OK**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid or expired refresh token"
}
```

:::note Token Rotation
The refresh token is rotated on each use. The old token is invalidated immediately.
:::

---

## Logout

Invalidate the current session.

```
POST /api/auth/logout
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Response

**200 OK**
```json
{
  "message": "Logged out successfully"
}
```

---

## Get Current User

Get the authenticated user's profile.

```
GET /api/auth/me
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
  "email": "user@example.com",
  "isAdmin": false,
  "personalityMode": "creative",
  "subscriptionStatus": "active",
  "chatName": "Friend",
  "gender": "neutral",
  "responseLength": "moderate",
  "createdAt": "2025-01-08T12:00:00.000Z"
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid or expired token"
}
```

---

## Forgot Password

Request a password reset email.

```
POST /api/auth/forgot-password
```

### Request

```json
{
  "email": "user@example.com"
}
```

### Response

**200 OK** (Always returns success to prevent email enumeration)
```json
{
  "message": "If an account exists with this email, a reset link has been sent."
}
```

### Rate Limit

- **3 attempts** per **1 hour** per IP

---

## Reset Password

Reset password using a token from the reset email.

```
POST /api/auth/reset-password
```

### Request

```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "password": "newSecurePassword123"
}
```

### Response

**200 OK**
```json
{
  "message": "Password reset successful"
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid or expired reset token"
}
```

**400 Bad Request**
```json
{
  "error": "Password must be at least 8 characters"
}
```

:::warning Session Invalidation
All existing sessions are invalidated when password is reset. User must log in again on all devices.
:::

---

## Request Magic Link

Send a passwordless login link to email.

```
POST /api/auth/magic-link
```

### Request

```json
{
  "email": "user@example.com"
}
```

### Response

**200 OK**
```json
{
  "message": "Magic link sent to your email"
}
```

**404 Not Found**
```json
{
  "error": "No account found with this email"
}
```

### Rate Limit

- **5 attempts** per **15 minutes** per IP

---

## Verify Magic Link

Verify a magic link token and get auth tokens.

```
POST /api/auth/magic-link/verify
```

### Request

```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response

**200 OK**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "isAdmin": false
  }
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid or expired magic link"
}
```

---

## Exchange Token

Exchange a single-use code for auth tokens. Used for cross-app authentication.

```
POST /api/auth/exchange-token
```

### Request

```json
{
  "code": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response

**200 OK**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "isAdmin": false,
    "personalityMode": "creative"
  }
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid or expired exchange code"
}
```

:::note Exchange Token Flow
Exchange tokens are created by the Funnel app after Stripe checkout completion. They expire after 5 minutes and can only be used once.
:::

---

## Token Structure

### Access Token

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "isAdmin": false,
  "type": "access",
  "iat": 1704720000,
  "exp": 1704720900
}
```

- **Expiry**: 15 minutes
- **Algorithm**: HS256

### Refresh Token

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "isAdmin": false,
  "type": "refresh",
  "iat": 1704720000,
  "exp": 1705324800
}
```

- **Expiry**: 7 days
- **Algorithm**: HS256
- **Storage**: Hashed in database

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `TOKEN_EXPIRED` | 401 | Access/refresh token expired |
| `TOKEN_INVALID` | 401 | Malformed or tampered token |
| `RATE_LIMITED` | 429 | Too many attempts |
