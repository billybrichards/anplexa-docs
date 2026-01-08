---
sidebar_position: 1
---

# Authentication Flows

Detailed sequence diagrams for all authentication scenarios in the Anplexa platform.

## Email/Password Login

Standard login flow for returning users.

```mermaid
sequenceDiagram
    actor User
    participant UI as Companions App
    participant Context as AuthContext
    participant API as API Route
    participant Backend as Backend API
    participant DB as Database

    User->>UI: Click "Login"
    UI->>UI: Show login modal

    User->>UI: Enter email & password
    User->>UI: Click "Sign In"

    UI->>Context: login(email, password)
    Context->>API: POST /api/auth/login

    API->>Backend: POST /api/auth/login
    Note over API,Backend: Proxy with X-API-Key

    Backend->>DB: Find user by email
    DB-->>Backend: User record

    alt User not found
        Backend-->>API: 401 { error: "Invalid credentials" }
        API-->>Context: 401 Error
        Context-->>UI: Show error toast
    else User found
        Backend->>Backend: bcrypt.compare(password, hash)

        alt Password invalid
            Backend-->>API: 401 { error: "Invalid credentials" }
            API-->>Context: 401 Error
            Context-->>UI: Show error toast
        else Password valid
            Backend->>Backend: Generate JWT pair
            Backend->>DB: Store refresh token
            Backend-->>API: 200 { accessToken, refreshToken, user }
            API-->>Context: Success response

            Context->>Context: localStorage.setItem('accessToken')
            Context->>Context: localStorage.setItem('refreshToken')
            Context->>Context: setUser(user)

            Context->>API: GET /api/subscription
            API->>Backend: GET /api/subscription
            Backend-->>API: { status, plan }
            API-->>Context: Subscription data
            Context->>Context: setSubscriptionStatus()

            Context-->>UI: Login success
            UI->>UI: Close modal
            UI->>UI: Show chat interface
        end
    end
```

## User Registration

New user account creation flow.

```mermaid
sequenceDiagram
    actor User
    participant UI as Companions App
    participant Context as AuthContext
    participant API as API Route
    participant Backend as Backend API
    participant DB as Database

    User->>UI: Click "Create Account"
    UI->>UI: Show registration form

    User->>UI: Enter email, password, confirm password
    User->>UI: Click "Create Account"

    UI->>UI: Validate passwords match

    UI->>Context: register(email, password)
    Context->>API: POST /api/auth/register

    API->>Backend: POST /api/auth/register
    Backend->>DB: Check email exists

    alt Email already registered
        DB-->>Backend: User exists
        Backend-->>API: 409 { error: "Email already registered" }
        API-->>Context: 409 Conflict
        Context-->>UI: Show error "Email already in use"
    else Email available
        DB-->>Backend: No user found
        Backend->>Backend: bcrypt.hash(password, 12)
        Backend->>DB: INSERT user
        DB-->>Backend: New user

        Backend->>Backend: Generate JWT pair
        Backend->>DB: Store refresh token

        Backend-->>API: 201 { accessToken, refreshToken, user }
        API-->>Context: Success response

        Context->>Context: Store tokens
        Context->>Context: setUser(user)
        Context-->>UI: Registration success

        UI->>UI: Close modal
        UI->>UI: Show welcome message
    end
```

## Token Refresh

Automatic token refresh when access token expires.

```mermaid
sequenceDiagram
    actor User
    participant UI as Companions App
    participant Context as AuthContext
    participant API as API Route
    participant Backend as Backend API
    participant DB as Database

    Note over User,DB: Access token expires (15 minutes)

    User->>UI: Perform action (send message)
    UI->>Context: apiCall with accessToken
    Context->>API: POST /api/chat
    Note over Context,API: Authorization: Bearer {expired}

    API->>Backend: POST /api/chat
    Backend->>Backend: Verify JWT
    Backend-->>API: 401 { error: "Token expired" }
    API-->>Context: 401 Unauthorized

    Context->>Context: Attempt token refresh
    Context->>Context: Get refreshToken from localStorage

    Context->>API: POST /api/auth/refresh
    API->>Backend: POST /api/auth/refresh

    Backend->>DB: Find session by refresh token
    DB-->>Backend: Session record

    alt Refresh token valid
        Backend->>Backend: Generate new JWT pair
        Backend->>DB: Rotate refresh token (invalidate old)
        Backend-->>API: 200 { accessToken, refreshToken }
        API-->>Context: New tokens

        Context->>Context: Update localStorage
        Context->>Context: Retry original request

        Context->>API: POST /api/chat
        Note over Context,API: Authorization: Bearer {new}
        API->>Backend: POST /api/chat
        Backend-->>API: 200 Success
        API-->>Context: Chat response
        Context-->>UI: Show response
    else Refresh token invalid/expired
        Backend-->>API: 401 { error: "Invalid refresh token" }
        API-->>Context: 401 Error

        Context->>Context: Clear localStorage
        Context->>Context: setUser(null)
        Context-->>UI: Session expired

        UI->>UI: Show login modal
    end
```

## Magic Link Authentication

Passwordless login via email link.

```mermaid
sequenceDiagram
    actor User
    participant UI as Companions App
    participant API as API Route
    participant Backend as Backend API
    participant DB as Database
    participant Email as Resend Email

    User->>UI: Click "Magic Link"
    User->>UI: Enter email
    User->>UI: Click "Send Link"

    UI->>API: POST /api/auth/magic-link
    API->>Backend: POST /api/auth/magic-link

    Backend->>DB: Find user by email

    alt User not found
        Backend-->>API: 404 { error: "No account with this email" }
        API-->>UI: Show error
    else User found
        Backend->>Backend: Generate magic token (UUID)
        Backend->>Backend: Hash token
        Backend->>DB: Store hashed token + expiry (15 min)

        Backend->>Email: Send magic link email
        Note over Backend,Email: Link: /auth/magic-link?token={uuid}

        Email-->>User: Email with login link

        Backend-->>API: 200 { message: "Magic link sent" }
        API-->>UI: Show success message
    end

    Note over User,DB: User clicks email link

    User->>UI: Click magic link
    UI->>UI: Extract token from URL
    UI->>API: POST /api/auth/magic-link/verify

    API->>Backend: POST /api/auth/magic-link/verify
    Backend->>Backend: Hash received token
    Backend->>DB: Find by hashed token

    alt Token invalid
        Backend-->>API: 401 { error: "Invalid or expired link" }
        API-->>UI: Show error
    else Token valid
        Backend->>DB: Delete used token
        Backend->>Backend: Generate JWT pair
        Backend->>DB: Store refresh token

        Backend-->>API: 200 { accessToken, refreshToken, user }
        API-->>UI: Login success
        UI->>UI: Store tokens, redirect to chat
    end
```

## Exchange Token Flow

Cross-app authentication from Funnel to Companions.

```mermaid
sequenceDiagram
    actor User
    participant Funnel as Funnel App
    participant FunnelAPI as Funnel API
    participant Backend as Backend API
    participant DB as Database
    participant Companions as Companions App

    Note over User,Companions: After Stripe payment success

    User->>Funnel: Create password
    Funnel->>FunnelAPI: POST /api/register-subscriber

    FunnelAPI->>Backend: POST /api/funnel/users
    Note over FunnelAPI,Backend: Create user with personality profile
    Backend->>DB: INSERT user with profile
    Backend-->>FunnelAPI: { userId, email }

    FunnelAPI->>Backend: POST /api/auth/login
    Backend-->>FunnelAPI: { accessToken, refreshToken }

    FunnelAPI->>FunnelAPI: Generate exchange code (UUID)
    FunnelAPI->>Backend: POST /api/auth/exchange-token/create

    Backend->>Backend: Hash exchange code
    Backend->>DB: Store { hashedCode, userId, expiresAt: 5min }
    Backend-->>FunnelAPI: { success: true }

    FunnelAPI-->>Funnel: { redirectUrl, exchangeCode }

    Funnel->>Companions: Redirect with ?code={exchangeCode}

    Companions->>Companions: Extract code from URL
    Companions->>Backend: POST /api/auth/exchange-token

    Backend->>Backend: Hash received code
    Backend->>DB: Find by hashed code

    alt Code invalid or expired
        Backend-->>Companions: 401 { error: "Invalid code" }
        Companions->>Companions: Show login modal
    else Code valid
        Backend->>DB: Delete used code
        Backend->>Backend: Generate JWT pair
        Backend->>DB: Store refresh token

        Backend-->>Companions: 200 { accessToken, refreshToken, user }
        Companions->>Companions: Store tokens
        Companions->>Companions: Redirect to chat
    end
```

## Password Reset

Forgot password recovery flow.

```mermaid
sequenceDiagram
    actor User
    participant UI as Companions App
    participant API as API Route
    participant Backend as Backend API
    participant DB as Database
    participant Email as Resend Email

    User->>UI: Click "Forgot Password"
    User->>UI: Enter email
    User->>UI: Click "Send Reset Link"

    UI->>API: POST /api/auth/forgot-password
    API->>Backend: POST /api/auth/forgot-password

    Backend->>DB: Find user by email

    alt User not found
        Backend-->>API: 200 { message: "If account exists, email sent" }
        Note over Backend: Don't reveal if email exists
    else User found
        Backend->>Backend: Generate reset token (UUID)
        Backend->>Backend: Hash token
        Backend->>DB: Store hashed token + expiry (1 hour)

        Backend->>Email: Send reset email
        Note over Backend,Email: Link: /reset-password?token={uuid}

        Email-->>User: Password reset email
    end

    API-->>UI: Show "Check your email"

    Note over User,DB: User clicks reset link

    User->>UI: Click reset link
    UI->>UI: Show new password form
    User->>UI: Enter new password
    User->>UI: Click "Reset Password"

    UI->>API: POST /api/auth/reset-password
    API->>Backend: POST /api/auth/reset-password

    Backend->>Backend: Hash received token
    Backend->>DB: Find by hashed token

    alt Token invalid
        Backend-->>API: 401 { error: "Invalid or expired token" }
        API-->>UI: Show error
    else Token valid
        Backend->>Backend: Hash new password
        Backend->>DB: UPDATE user password
        Backend->>DB: DELETE reset token
        Backend->>DB: DELETE all sessions (logout everywhere)

        Backend-->>API: 200 { message: "Password reset successful" }
        API-->>UI: Show success, redirect to login
    end
```

## Logout

Session termination flow.

```mermaid
sequenceDiagram
    actor User
    participant UI as Companions App
    participant Context as AuthContext
    participant API as API Route
    participant Backend as Backend API
    participant DB as Database

    User->>UI: Click "Logout"

    UI->>Context: logout()

    Context->>API: POST /api/auth/logout
    Note over Context,API: Authorization: Bearer {accessToken}

    API->>Backend: POST /api/auth/logout
    Backend->>Backend: Extract user from token
    Backend->>DB: DELETE session (refresh token)
    Backend-->>API: 200 { message: "Logged out" }

    API-->>Context: Success

    Context->>Context: localStorage.removeItem('accessToken')
    Context->>Context: localStorage.removeItem('refreshToken')
    Context->>Context: localStorage.removeItem('user')
    Context->>Context: setUser(null)

    Context-->>UI: Logout complete
    UI->>UI: Redirect to landing page
```

## Session Validation

How the app validates an existing session on page load.

```mermaid
sequenceDiagram
    actor User
    participant UI as Companions App
    participant Context as AuthContext
    participant API as API Route
    participant Backend as Backend API

    User->>UI: Visit companions app
    UI->>Context: Initialize AuthProvider

    Context->>Context: Check localStorage

    alt No tokens stored
        Context->>Context: setUser(null)
        Context-->>UI: Show guest mode / login
    else Tokens exist
        Context->>Context: setIsLoading(true)
        Context->>API: GET /api/auth/me
        Note over Context,API: Authorization: Bearer {accessToken}

        API->>Backend: GET /api/auth/me

        alt Token valid
            Backend-->>API: 200 { user }
            API-->>Context: User data
            Context->>Context: setUser(user)
            Context->>Context: Check subscription status
            Context->>Context: setIsLoading(false)
            Context-->>UI: Show authenticated state
        else Token expired
            Backend-->>API: 401 Unauthorized
            API-->>Context: 401 Error
            Context->>Context: Attempt refresh
            Note over Context: See Token Refresh flow
        end
    end
```

## Security Considerations

### Token Storage

| Token | Storage | Concerns | Mitigation |
|-------|---------|----------|------------|
| Access Token | localStorage | XSS vulnerability | Short expiry (15 min), migrate to HttpOnly cookies |
| Refresh Token | localStorage | XSS vulnerability | Longer expiry (7 days), rotation on use |

### Rate Limiting

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/auth/login` | 10 | 15 min | Brute force prevention |
| `/auth/register` | 5 | 1 hour | Spam prevention |
| `/auth/forgot-password` | 3 | 1 hour | Email spam prevention |
| `/auth/magic-link` | 5 | 15 min | Email spam prevention |

### Token Security

- **Access tokens**: Signed with HS256, 15-minute expiry
- **Refresh tokens**: Rotated on each use, stored hashed in DB
- **Exchange tokens**: Single-use, 5-minute expiry, hashed storage
- **Magic link tokens**: Single-use, 15-minute expiry, hashed storage
- **Reset tokens**: Single-use, 1-hour expiry, hashed storage
