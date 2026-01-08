---
sidebar_position: 4
---

# Funnel Conversion Flow

Complete user journey through the marketing funnel, from discovery to account creation.

## Complete Conversion Flow

```mermaid
sequenceDiagram
    actor User
    participant Entry as Funnel Entry
    participant Quiz as Quiz Flow
    participant Email as Email Capture
    participant Pricing as Pricing Section
    participant Stripe as Stripe Checkout
    participant Success as Success Page
    participant Backend as Backend API
    participant App as Companions App

    Note over User,App: Phase 1: Discovery
    User->>Entry: Visit funnel.anplexa.com
    Entry->>Entry: Display 6 persona cards

    Note over User,App: Phase 2: Persona Selection
    User->>Entry: Click persona card
    Entry->>Entry: Track: persona_selected

    Note over User,App: Phase 3: Quiz
    Entry->>Quiz: Navigate to /funnel/{persona}/paid
    loop 3 Questions
        Quiz->>Quiz: Display question
        User->>Quiz: Select answer
        Quiz->>Backend: POST /funnel-responses
        Quiz->>Quiz: Track: question_answered
    end

    Note over User,App: Phase 4: Email Capture
    Quiz->>Email: Show email input
    User->>Email: Enter email
    Email->>Backend: POST /funnel/profile
    Email->>Email: Track: email_submitted

    Note over User,App: Phase 5: Pricing Decision
    Email->>Pricing: Show pricing options

    alt Free Path
        User->>Pricing: Click "Try Free"
        Pricing->>Backend: POST /emails
        Pricing->>App: Redirect to companions
        Note over App: Guest mode with profile
    else Paid Path
        User->>Pricing: Click "Subscribe"
        Pricing->>Backend: GET /stripe/checkout
        Backend->>Stripe: Create session
        Pricing->>Stripe: Redirect to checkout
    end

    Note over User,App: Phase 6: Payment
    User->>Stripe: Complete payment
    Stripe->>Backend: Webhook (completed)
    Stripe->>Success: Redirect to /success

    Note over User,App: Phase 7: Account Creation
    Success->>Success: Show password form
    User->>Success: Create password
    Success->>Backend: POST /register-subscriber
    Backend->>Backend: Create user with profile
    Backend->>Success: { redirectUrl, exchangeToken }

    Note over User,App: Phase 8: App Access
    Success->>App: Redirect with exchange token
    App->>Backend: POST /auth/exchange-token
    Backend->>App: JWT tokens
    App->>App: Store tokens, show chat
```

## Persona Selection

```mermaid
graph TB
    subgraph "Entry Page"
        Title[Choose Your Path]
        Cards[6 Persona Cards]
    end

    subgraph "Personas"
        A[A: Quietly Lonely<br/>Connection seeking]
        B[B: Curious Explorer<br/>Fantasy open]
        C[C: Privacy First<br/>Safety focused]
        D[D: Late Night Thinker<br/>Reflective]
        E[E: Emotional Explorer<br/>Deep understanding]
        F[F: Creative Seeker<br/>Playful imagination]
    end

    Cards --> A
    Cards --> B
    Cards --> C
    Cards --> D
    Cards --> E
    Cards --> F

    A -->|Click| QuizA[Quiz with A questions]
    B -->|Click| QuizB[Quiz with B questions]
    C -->|Click| QuizC[Quiz with C questions]
    D -->|Click| QuizD[Quiz with D questions]
    E -->|Click| QuizE[Quiz with E questions]
    F -->|Click| QuizF[Quiz with F questions]
```

## Quiz Flow Detail

Each persona has 3 tailored questions:

```mermaid
sequenceDiagram
    actor User
    participant UI as FunnelFlow
    participant State as Local State
    participant API as Funnel API
    participant Analytics as PostHog

    Note over User,Analytics: Question 1

    UI->>UI: Display Q1 with options
    User->>UI: Select answer
    UI->>State: Store response
    UI->>API: POST /funnel-responses
    Note over API: { sessionId, persona, questionId: 'q1', answer }
    UI->>Analytics: Track question_answered

    Note over User,Analytics: Question 2

    UI->>UI: Animate to Q2
    User->>UI: Select answer
    UI->>State: Store response
    UI->>API: POST /funnel-responses
    UI->>Analytics: Track question_answered

    Note over User,Analytics: Question 3

    UI->>UI: Animate to Q3
    User->>UI: Select answer
    UI->>State: Store response
    UI->>API: POST /funnel-responses
    UI->>Analytics: Track question_answered

    UI->>UI: Transition to email capture
```

### Example Questions (Persona A)

| Q# | Question | Options |
|----|----------|---------|
| 1 | What do you look for most in a conversation? | Understanding, Entertainment, Deep connection, Practical advice |
| 2 | How do you prefer to communicate? | Long messages, Short exchanges, Voice notes, Mixed |
| 3 | What time do you usually chat? | Morning, Afternoon, Evening, Late night |

## Profile Submission

After email capture, personality profile is sent to backend.

```mermaid
sequenceDiagram
    participant UI as FunnelFlow
    participant API as Funnel API
    participant Backend as Backend API
    participant DB as Database

    UI->>UI: User submits email

    UI->>API: POST /funnel/profile
    Note over UI,API: Request Body

    Note over API: {
    Note over API:   email: "user@example.com",
    Note over API:   persona: "A",
    Note over API:   responses: {
    Note over API:     q1: "Deep connection",
    Note over API:     q2: "Long messages",
    Note over API:     q3: "Late night"
    Note over API:   },
    Note over API:   profile: {
    Note over API:     primaryNeed: "Connection",
    Note over API:     communicationStyle: "Gentle",
    Note over API:     pace: "Slow",
    Note over API:     tags: ["lonely", "seeking-connection"]
    Note over API:   }
    Note over API: }

    API->>Backend: POST /api/funnel/profile
    Backend->>DB: Store contact_submission
    Backend->>DB: Store funnel data in user record
    Backend-->>API: 200 OK
    API-->>UI: Profile saved
```

## Duplicate User Handling

```mermaid
sequenceDiagram
    actor User
    participant Funnel as Funnel App
    participant API as Funnel API
    participant Backend as Backend API
    participant DB as Database

    User->>Funnel: Complete quiz, enter email
    Funnel->>API: GET /stripe/checkout
    Note over Funnel,API: email: existing@user.com

    API->>Backend: POST /check-user-subscription
    Backend->>DB: Find by email
    DB-->>Backend: User exists

    Backend-->>API: { exists: true, hasSubscription: true }

    alt Has active subscription
        API-->>Funnel: 409 {
        API-->>Funnel:   error: "Account exists",
        API-->>Funnel:   loginUrl: "/login"
        API-->>Funnel: }

        Funnel->>Funnel: Show "Already Registered" view
        Funnel->>Funnel: Display login link
    else No subscription
        API-->>Funnel: 409 {
        API-->>Funnel:   error: "Account exists",
        API-->>Funnel:   message: "Login to upgrade",
        API-->>Funnel:   loginUrl: "/login"
        API-->>Funnel: }

        Funnel->>Funnel: Show "Continue where you left off"
    end
```

## Registration Flow Detail

After successful Stripe payment:

```mermaid
sequenceDiagram
    actor User
    participant Success as Success Page
    participant FunnelAPI as Funnel API
    participant Backend as Backend API
    participant Stripe as Stripe API
    participant DB as Database

    User->>Success: Return from Stripe
    Note over Success: URL: /success?session_id={id}

    Success->>Success: Parse session_id
    Success->>Success: Show password form

    User->>Success: Enter password
    User->>Success: Click "Create Account"

    Success->>FunnelAPI: POST /register-subscriber
    Note over Success,FunnelAPI: { sessionId, password }

    FunnelAPI->>Stripe: Retrieve checkout session
    Stripe-->>FunnelAPI: { customer_email, metadata }

    FunnelAPI->>Backend: POST /funnel/users
    Note over FunnelAPI,Backend: Create user with profile

    Backend->>DB: INSERT user
    Note over DB: Include persona, responses, profile
    DB-->>Backend: { userId }

    Backend-->>FunnelAPI: { userId, email }

    FunnelAPI->>Backend: POST /auth/login
    Note over FunnelAPI,Backend: Auto-login the new user
    Backend-->>FunnelAPI: { accessToken, refreshToken }

    FunnelAPI->>Backend: POST /stripe/verify-checkout
    Note over FunnelAPI,Backend: Link Stripe customer to user
    Backend->>DB: UPDATE user.stripeCustomerId
    Backend->>DB: UPDATE user.subscriptionStatus = 'active'
    Backend-->>FunnelAPI: Verified

    FunnelAPI->>FunnelAPI: Create exchange token
    FunnelAPI->>Backend: POST /auth/exchange-token/create
    Backend->>DB: Store hashed token
    Backend-->>FunnelAPI: OK

    FunnelAPI-->>Success: {
    FunnelAPI-->>Success:   redirectUrl: "https://anplexa.com/companions",
    FunnelAPI-->>Success:   exchangeToken: "xxx"
    FunnelAPI-->>Success: }

    Success->>Success: Redirect with token
```

## Free Path Flow

```mermaid
sequenceDiagram
    actor User
    participant Funnel as Funnel App
    participant API as Funnel API
    participant Backend as Backend API
    participant DB as Database
    participant App as Companions App

    User->>Funnel: Complete quiz
    User->>Funnel: Enter email
    User->>Funnel: Click "Try Free"

    Funnel->>API: POST /emails
    Note over Funnel,API: { email, funnelSource, persona }

    API->>DB: INSERT email (waitlist)
    API->>Backend: POST /funnel/profile
    Note over API,Backend: Store profile without user

    Backend-->>API: OK
    API-->>Funnel: { success: true }

    Funnel->>Funnel: Track: free_signup
    Funnel->>App: Redirect to companions

    Note over App: User arrives in guest mode
    Note over App: Profile stored for when they sign up
```

## Analytics Events

### Funnel Stage Tracking

| Stage | Event | Properties |
|-------|-------|------------|
| Entry | `funnel_start` | (empty) |
| Persona Select | `persona_selected` | persona |
| Q1 Answer | `question_answered` | persona, questionId: 'q1', answer |
| Q2 Answer | `question_answered` | persona, questionId: 'q2', answer |
| Q3 Answer | `question_answered` | persona, questionId: 'q3', answer |
| Email Submit | `email_submitted` | persona, path: 'paid' or 'free' |
| Checkout Start | `checkout_started` | persona, priceId |
| Checkout Complete | `checkout_completed` | persona |
| Account Create | `account_created` | persona |
| Free Signup | `free_signup` | persona |

### Conversion Funnel Analysis

```mermaid
graph TB
    subgraph "Funnel Stages"
        V[Page Views]
        S[Persona Selected]
        Q1[Q1 Answered]
        Q2[Q2 Answered]
        Q3[Q3 Answered]
        E[Email Submitted]
        C[Checkout Started]
        P[Payment Complete]
        A[Account Created]
    end

    V -->|"70%"| S
    S -->|"90%"| Q1
    Q1 -->|"85%"| Q2
    Q2 -->|"80%"| Q3
    Q3 -->|"75%"| E
    E -->|"40% paid<br/>60% free"| C
    C -->|"65%"| P
    P -->|"95%"| A
```

## Error States

### Checkout Creation Failure

```mermaid
sequenceDiagram
    actor User
    participant Funnel
    participant API
    participant Stripe

    User->>Funnel: Click subscribe
    Funnel->>API: GET /stripe/checkout
    API->>Stripe: Create session

    alt Stripe error
        Stripe-->>API: 500 Error
        API-->>Funnel: 500 { error: "Payment system unavailable" }
        Funnel->>Funnel: Show error toast
        Funnel->>Funnel: Keep pricing visible
    end
```

### Registration Failure

```mermaid
sequenceDiagram
    actor User
    participant Success
    participant API
    participant Backend

    User->>Success: Submit password
    Success->>API: POST /register-subscriber

    alt Backend unavailable
        API->>Backend: Request timeout
        API-->>Success: 500 Error
        Success->>Success: Show retry button
        Success->>Success: "Account creation failed"
    else Invalid session
        API->>API: Session not found
        API-->>Success: 400 { error: "Invalid session" }
        Success->>Success: Show support contact
    end
```

## Session State Management

### Current Issue: State Lost on Refresh

```typescript
// Current: State in React useState (lost on refresh)
const [sessionId] = useState(() => crypto.randomUUID());
const [responses, setResponses] = useState({});
```

### Recommended: Persist to localStorage

```typescript
// Recommended: useFunnelSession hook
function useFunnelSession(persona: string) {
  const [session, setSession] = useState(() => {
    const key = `funnel-session-${persona}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if session is less than 1 hour old
      if (Date.now() - parsed.createdAt < 3600000) {
        return parsed;
      }
    }
    return {
      id: crypto.randomUUID(),
      persona,
      responses: {},
      email: null,
      createdAt: Date.now(),
    };
  });

  useEffect(() => {
    localStorage.setItem(`funnel-session-${persona}`, JSON.stringify(session));
  }, [session, persona]);

  return { session, updateResponse, setEmail, clearSession };
}
```
