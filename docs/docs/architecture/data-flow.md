---
sidebar_position: 5
---

# Data Flow

End-to-end data flow documentation showing how data moves through the Anplexa platform.

## System Overview

```mermaid
graph LR
    subgraph "User Entry"
        User((User))
    end

    subgraph "Funnel App"
        FE[Funnel Entry]
        FQ[Quiz Flow]
        FC[Checkout]
    end

    subgraph "Companions App"
        CE[Chat Entry]
        CI[Chat Interface]
        CS[Settings]
    end

    subgraph "API Server"
        Auth[Auth Service]
        Chat[Chat Service]
        Sub[Subscription Service]
    end

    subgraph "External"
        Stripe[(Stripe)]
        Ollama[(Ollama LLM)]
        DB[(PostgreSQL)]
    end

    User --> FE
    User --> CE
    FE --> FQ --> FC --> Stripe
    FC --> Auth
    CE --> Auth
    CI --> Chat --> Ollama
    CS --> Auth
    Auth --> DB
    Chat --> DB
    Sub --> Stripe
    Sub --> DB
```

## User Journey Data Flow

### New User (Paid Path)

```mermaid
sequenceDiagram
    actor User
    participant F as Funnel
    participant API
    participant Stripe
    participant C as Companions
    participant DB

    Note over User,DB: 1. Discovery & Quiz
    User->>F: Visit funnel
    F->>F: Select persona (A-F)
    F->>API: POST /funnel-responses (q1, q2, q3)
    API->>DB: Store responses

    Note over User,DB: 2. Email Capture
    F->>F: Enter email
    F->>API: POST /funnel/profile
    API->>DB: Store personality profile

    Note over User,DB: 3. Payment
    F->>API: GET /stripe/checkout
    API->>Stripe: Create session
    Stripe-->>F: Checkout URL
    User->>Stripe: Complete payment
    Stripe->>API: Webhook (completed)
    API->>DB: Update subscription

    Note over User,DB: 4. Account Creation
    User->>F: Create password
    F->>API: POST /register-subscriber
    API->>DB: Create user
    API-->>F: JWT tokens + redirect

    Note over User,DB: 5. Chat Access
    F->>C: Redirect with exchange token
    C->>API: POST /auth/exchange-token
    API-->>C: JWT tokens
    C->>API: POST /chat
    API->>DB: Load personality
    API-->>C: Personalized AI response
```

### Returning User

```mermaid
sequenceDiagram
    actor User
    participant C as Companions
    participant API
    participant DB
    participant Ollama

    User->>C: Visit companions
    C->>C: Check localStorage (tokens)

    alt Has valid token
        C->>API: GET /auth/me
        API->>DB: Validate session
        DB-->>API: User data
        API-->>C: User profile
    else Token expired
        C->>API: POST /auth/refresh
        API->>DB: Validate refresh token
        API->>API: Generate new pair
        API->>DB: Store new refresh
        API-->>C: New tokens
    else No token
        C->>C: Show login modal
    end

    User->>C: Select conversation
    C->>API: GET /conversations/:id/messages
    API->>DB: Fetch messages
    DB-->>API: Message history
    API-->>C: Messages

    User->>C: Send message
    C->>API: POST /chat (SSE)
    API->>DB: Load user preferences
    API->>Ollama: Stream request
    Ollama-->>API: Token stream
    API-->>C: SSE response
    C->>C: Update UI progressively
```

## Data Stores

### Primary Database (PostgreSQL)

```mermaid
erDiagram
    users ||--o{ conversations : has
    users ||--o{ sessions : has
    users ||--o| user_preferences : has
    conversations ||--o{ messages : contains

    users {
        uuid id PK
        string email UK
        string password_hash
        string stripe_customer_id UK
        enum subscription_status
        string personality_mode
        json amplexa_responses
        timestamp created_at
    }

    conversations {
        uuid id PK
        uuid user_id FK
        string title
        timestamp created_at
        timestamp updated_at
    }

    messages {
        uuid id PK
        uuid conversation_id FK
        enum role
        text content
        timestamp created_at
    }

    sessions {
        uuid id PK
        uuid user_id FK
        string refresh_token_hash
        timestamp expires_at
    }

    user_preferences {
        uuid id PK
        uuid user_id FK
        string gender
        string response_style
        string theme
    }
```

### Client-Side Storage

| Store | Data | TTL | Purpose |
|-------|------|-----|---------|
| `localStorage.accessToken` | JWT | Session | API authentication |
| `localStorage.refreshToken` | JWT | 7 days | Token refresh |
| `localStorage.user` | User JSON | Session | User state |
| `localStorage.conversations` | Conversation[] | Permanent | Offline fallback |
| `localStorage.guestMessageCount` | number | Permanent | Guest limit tracking |
| `localStorage.pathChoice` | string | 30 days | Path selection memory |
| `localStorage.theme` | string | Permanent | Theme preference |

## API Data Contracts

### Authentication

```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    isAdmin: boolean;
    personalityMode: string | null;
    subscriptionStatus: string;
  };
}
```

### Chat

```typescript
// POST /api/chat
interface ChatRequest {
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
  conversationId?: string;
  preferences?: {
    responseLength: 'brief' | 'moderate' | 'detailed';
    personalityMode?: string;
  };
}

// Response: Server-Sent Events
// event: delta
// data: {"content": "token"}
//
// event: done
// data: {"messageId": "uuid"}
```

### Conversations

```typescript
// GET /api/conversations
interface ConversationsResponse {
  conversations: {
    id: string;
    title: string;
    messageCount: number;
    lastMessageAt: string;
    createdAt: string;
  }[];
}

// PUT /api/conversations/:id
interface SaveConversationRequest {
  title?: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }[];
}
```

### Subscription

```typescript
// GET /api/subscription
interface SubscriptionResponse {
  status: 'active' | 'inactive' | 'trial' | 'cancelled';
  plan: 'unlimited' | 'unlimited_super' | null;
  expiresAt: string | null;
  stripeCustomerId: string | null;
}
```

## Event Flow (Analytics)

### PostHog Event Pipeline

```mermaid
graph LR
    subgraph "Client Events"
        FE[Funnel Events]
        CE[Companions Events]
    end

    subgraph "PostHog"
        Capture[Event Capture]
        Process[Processing]
        Store[Event Storage]
    end

    subgraph "Analysis"
        Funnel[Funnel Analysis]
        Cohorts[User Cohorts]
        Paths[User Paths]
    end

    FE --> Capture
    CE --> Capture
    Capture --> Process --> Store
    Store --> Funnel
    Store --> Cohorts
    Store --> Paths
```

### Key Events

| Event | Source | Properties |
|-------|--------|------------|
| `funnel_start` | Funnel | (none) |
| `persona_selected` | Funnel | persona |
| `question_answered` | Funnel | persona, questionId, answer |
| `email_submitted` | Funnel | persona, path |
| `checkout_started` | Funnel | persona, priceId |
| `checkout_completed` | Funnel | persona |
| `account_created` | Funnel | persona |
| `chat_message_sent` | Companions | conversationId, isGuest |
| `guest_limit_reached` | Companions | messageCount |
| `login_success` | Companions | method |
| `subscription_upgraded` | Companions | plan |

## Stripe Data Flow

### Checkout Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Stripe
    participant Webhook

    Client->>API: GET /stripe/checkout
    API->>Stripe: Create checkout session
    Stripe-->>API: Session { id, url }
    API-->>Client: { url }

    Client->>Stripe: Redirect to checkout
    Note over Stripe: User completes payment

    Stripe->>Webhook: checkout.session.completed
    Webhook->>API: POST /stripe/webhook
    API->>API: Verify signature
    API->>API: Update user subscription
    API-->>Webhook: { received: true }

    Stripe-->>Client: Redirect to success_url
```

### Subscription Lifecycle

| Event | Trigger | Action |
|-------|---------|--------|
| `checkout.session.completed` | Payment success | Create/update customer, activate subscription |
| `customer.subscription.updated` | Plan change | Update user plan type |
| `customer.subscription.deleted` | Cancellation | Set status to cancelled |
| `invoice.payment_failed` | Payment failure | Send warning email |
| `invoice.paid` | Renewal success | Extend subscription |

## Error Handling Data Flow

### Error Response Standardization

```typescript
// All API errors follow this shape
interface ErrorResponse {
  error: string;      // User-facing message
  code?: string;      // Machine-readable code
  details?: unknown;  // Debug info (dev only)
}

// HTTP Status Codes
// 400 - Validation error
// 401 - Unauthorized (missing/invalid token)
// 402 - Payment required (credits exhausted)
// 403 - Forbidden (insufficient permissions)
// 404 - Resource not found
// 409 - Conflict (duplicate email, etc.)
// 429 - Rate limited
// 500 - Internal server error
```

### Error Flow

```mermaid
graph TB
    Request[API Request]
    Validate{Validation}
    Auth{Auth Check}
    Business{Business Logic}
    DB{Database}
    External{External API}

    Request --> Validate
    Validate -->|Invalid| E400[400 Bad Request]
    Validate -->|Valid| Auth

    Auth -->|No Token| E401[401 Unauthorized]
    Auth -->|Invalid| E401
    Auth -->|Valid| Business

    Business -->|Duplicate| E409[409 Conflict]
    Business -->|No Credits| E402[402 Payment Required]
    Business -->|Forbidden| E403[403 Forbidden]
    Business -->|OK| DB

    DB -->|Not Found| E404[404 Not Found]
    DB -->|Error| E500[500 Server Error]
    DB -->|OK| External

    External -->|Timeout| E500
    External -->|Error| E500
    External -->|OK| Success[200 OK]
```

## Caching Strategy

### Current Implementation

| Data | Cache Location | TTL | Invalidation |
|------|----------------|-----|--------------|
| User session | In-memory | Request | - |
| Companion config | In-memory | App lifetime | Admin update |
| Rate limits | In-memory | Window | Window expiry |
| Conversations | localStorage | Permanent | Manual clear |

### Recommended Additions

| Data | Cache Location | TTL | Purpose |
|------|----------------|-----|---------|
| User sessions | Redis | 15 minutes | Distributed rate limiting |
| API responses | Redis | 5 minutes | Reduce DB load |
| Static content | CDN | 24 hours | Faster delivery |
