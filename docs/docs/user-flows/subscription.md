---
sidebar_position: 3
---

# Subscription Flow

Payment and subscription management flows using Stripe.

## Checkout Flow (Companions App)

Upgrade flow for existing users.

```mermaid
sequenceDiagram
    actor User
    participant UI as Companions App
    participant API as /api/stripe
    participant Backend as Backend API
    participant Stripe as Stripe API

    User->>UI: Click "Upgrade"
    UI->>UI: Show plan selection modal

    User->>UI: Select plan (Monthly/Yearly)

    UI->>API: POST /api/stripe/checkout
    Note over UI,API: { priceId, successUrl, cancelUrl }

    API->>Backend: POST /api/stripe/checkout
    Note over API,Backend: Authorization: Bearer {token}

    Backend->>Backend: Get user from token
    Backend->>Backend: Check existing subscription

    alt Already subscribed
        Backend-->>API: 400 { error: "Already subscribed" }
        API-->>UI: Show error
    else Not subscribed
        Backend->>Stripe: Create checkout session
        Note over Backend,Stripe: customer_email: user.email
        Note over Backend,Stripe: metadata: { userId }

        Stripe-->>Backend: { sessionId, url }
        Backend-->>API: { url }
        API-->>UI: { url }

        UI->>Stripe: Redirect to checkout
    end

    Note over User,Stripe: User completes payment

    Stripe-->>UI: Redirect to success_url
    UI->>UI: Show success message
    UI->>API: GET /api/subscription
    API->>Backend: GET /api/subscription
    Backend-->>API: { status: 'active', plan }
    API-->>UI: Update subscription status
```

## Checkout Flow (Funnel App)

New user signup through marketing funnel.

```mermaid
sequenceDiagram
    actor User
    participant Funnel as Funnel App
    participant FunnelAPI as Funnel Backend
    participant Stripe as Stripe API
    participant Backend as Backend API
    participant DB as Database

    Note over User,DB: User completed quiz, entered email

    User->>Funnel: Select pricing plan
    Funnel->>FunnelAPI: GET /api/stripe/checkout
    Note over Funnel,FunnelAPI: email, priceId, persona

    FunnelAPI->>FunnelAPI: Check for existing user
    FunnelAPI->>Backend: POST /api/check-user
    Backend->>DB: Find by email
    DB-->>Backend: User status

    alt User exists
        Backend-->>FunnelAPI: { exists: true }
        FunnelAPI-->>Funnel: 409 { loginUrl }
        Funnel->>Funnel: Show "Account exists" modal
    else User doesn't exist
        FunnelAPI->>Stripe: Create checkout session
        Note over FunnelAPI,Stripe: customer_email: email
        Note over FunnelAPI,Stripe: metadata: { persona, source: 'funnel' }

        Stripe-->>FunnelAPI: { url }
        FunnelAPI-->>Funnel: { url }

        Funnel->>Stripe: Redirect to checkout
    end

    Note over User,Stripe: User completes payment

    Stripe->>FunnelAPI: Webhook: checkout.session.completed
    FunnelAPI->>FunnelAPI: Verify webhook signature
    Note over FunnelAPI: Store session for verification

    Stripe-->>Funnel: Redirect to /success?session_id={id}
    Funnel->>Funnel: Show password creation form
```

## Webhook Processing

Stripe webhook handling for subscription events.

```mermaid
sequenceDiagram
    participant Stripe as Stripe
    participant Webhook as Webhook Endpoint
    participant Backend as Backend API
    participant DB as Database
    participant Email as Email Service

    Stripe->>Webhook: POST /api/stripe/webhook
    Note over Stripe,Webhook: Headers: stripe-signature

    Webhook->>Webhook: Get raw body
    Webhook->>Webhook: Verify signature

    alt Invalid signature
        Webhook-->>Stripe: 400 Invalid signature
    else Valid signature
        Webhook->>Webhook: Parse event

        alt checkout.session.completed
            Webhook->>Backend: Handle checkout
            Backend->>DB: Find/create customer
            Backend->>DB: Update subscription status
            Backend->>Email: Send welcome email
            Backend-->>Webhook: Success
        else customer.subscription.updated
            Webhook->>Backend: Handle update
            Backend->>DB: Update plan type
            Backend-->>Webhook: Success
        else customer.subscription.deleted
            Webhook->>Backend: Handle cancellation
            Backend->>DB: Set status = cancelled
            Backend->>Email: Send cancellation email
            Backend-->>Webhook: Success
        else invoice.payment_failed
            Webhook->>Backend: Handle failure
            Backend->>DB: Mark payment failed
            Backend->>Email: Send payment failed email
            Backend-->>Webhook: Success
        end

        Webhook-->>Stripe: 200 { received: true }
    end
```

## Subscription Status Check

How the app checks subscription status.

```mermaid
sequenceDiagram
    actor User
    participant UI as Companions App
    participant Context as AuthContext
    participant API as /api/subscription
    participant Backend as Backend API
    participant DB as Database
    participant Stripe as Stripe API

    Note over User,Stripe: On app load or after checkout

    UI->>Context: checkSubscription()
    Context->>API: GET /api/subscription

    API->>Backend: GET /api/subscription
    Backend->>DB: Get user subscription data
    DB-->>Backend: { stripeCustomerId, subscriptionStatus, planType }

    alt No Stripe customer
        Backend-->>API: { status: 'inactive', plan: null }
    else Has Stripe customer
        Backend->>Stripe: GET /customers/{id}/subscriptions
        Stripe-->>Backend: { subscriptions: [...] }

        Backend->>Backend: Parse subscription status

        alt Active subscription
            Backend-->>API: { status: 'active', plan: 'unlimited' }
        else Cancelled but active
            Backend-->>API: { status: 'active', endsAt: date }
        else Past due
            Backend-->>API: { status: 'past_due' }
        else Cancelled
            Backend-->>API: { status: 'cancelled' }
        end
    end

    API-->>Context: Subscription data
    Context->>Context: setSubscriptionStatus()
    Context-->>UI: Update UI
```

## Subscription Management Portal

Customer portal for managing subscriptions.

```mermaid
sequenceDiagram
    actor User
    participant UI as Account Page
    participant API as /api/stripe/portal
    participant Backend as Backend API
    participant Stripe as Stripe API

    User->>UI: Click "Manage Subscription"

    UI->>API: POST /api/stripe/portal
    API->>Backend: POST /api/stripe/portal

    Backend->>Backend: Get user from token
    Backend->>Backend: Get stripeCustomerId

    Backend->>Stripe: Create portal session
    Note over Backend,Stripe: customer: stripeCustomerId
    Note over Backend,Stripe: return_url: /account

    Stripe-->>Backend: { url }
    Backend-->>API: { url }
    API-->>UI: { url }

    UI->>Stripe: Redirect to portal

    Note over User,Stripe: User manages subscription

    Stripe-->>UI: Return to /account

    Note over UI: Portal actions trigger webhooks
```

## Plan Types

### Available Plans

| Plan | ID | Price | Billing | Features |
|------|------|-------|---------|----------|
| Monthly | `price_monthly_*` | £2.99 | Monthly | Unlimited messages |
| Early Believer | `price_yearly_*` | £11.99 | Yearly | Unlimited messages, priority support |

### Subscription States

```mermaid
stateDiagram-v2
    [*] --> inactive: New user
    inactive --> active: Checkout complete
    active --> past_due: Payment failed
    past_due --> active: Payment retry success
    past_due --> cancelled: Too many failures
    active --> cancelled: User cancels
    cancelled --> active: Resubscribe
```

### Status Mapping

| Status | Can Chat | Show Upgrade | Description |
|--------|----------|--------------|-------------|
| `active` | Yes | No | Active subscription |
| `trialing` | Yes | No | Trial period |
| `past_due` | Yes (grace) | Yes | Payment failed, grace period |
| `cancelled` | Until period end | Yes | Cancelled but paid until end |
| `inactive` | Guest only | Yes | No subscription |

## Stripe Event Types

### Handled Events

| Event | Trigger | Action |
|-------|---------|--------|
| `checkout.session.completed` | Payment success | Create/link customer, activate subscription |
| `customer.subscription.created` | New subscription | Update user subscription status |
| `customer.subscription.updated` | Plan change/renewal | Update plan type, status |
| `customer.subscription.deleted` | Cancellation complete | Set status to cancelled |
| `invoice.paid` | Successful payment | Log payment, extend access |
| `invoice.payment_failed` | Failed payment | Send warning, set past_due |

### Event Processing

```typescript
// Webhook handler structure
switch (event.type) {
  case 'checkout.session.completed':
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutComplete(session);
    break;

  case 'customer.subscription.updated':
    const subscription = event.data.object as Stripe.Subscription;
    await handleSubscriptionUpdate(subscription);
    break;

  case 'customer.subscription.deleted':
    const cancelled = event.data.object as Stripe.Subscription;
    await handleSubscriptionCancelled(cancelled);
    break;

  case 'invoice.payment_failed':
    const invoice = event.data.object as Stripe.Invoice;
    await handlePaymentFailed(invoice);
    break;
}
```

## Error Handling

### Payment Failures

```mermaid
sequenceDiagram
    participant Stripe
    participant Webhook
    participant Backend
    participant Email
    participant User

    Stripe->>Webhook: invoice.payment_failed
    Webhook->>Backend: Handle failure

    Backend->>Backend: Update subscription status
    Backend->>Email: Send payment failed email
    Email-->>User: "Payment failed" notification

    Note over User: User updates payment method

    User->>Stripe: Update card in portal
    Stripe->>Stripe: Retry payment
    Stripe->>Webhook: invoice.paid
    Webhook->>Backend: Handle success
    Backend->>Backend: Restore active status
```

### Checkout Abandonment

```mermaid
sequenceDiagram
    actor User
    participant Funnel
    participant Stripe

    User->>Funnel: Start checkout
    Funnel->>Stripe: Redirect to checkout

    Note over User,Stripe: User abandons checkout

    Stripe-->>Funnel: Redirect to cancel_url
    Funnel->>Funnel: Show return to pricing

    Note over Funnel: Track abandonment in PostHog
```

## Security Considerations

### Webhook Security

1. **Signature verification**: Always verify `stripe-signature` header
2. **Idempotency**: Handle duplicate events gracefully
3. **HTTPS only**: Webhook endpoint must be HTTPS
4. **Timing**: Process webhooks within 30 seconds

### Customer Data

1. **Don't store card details**: Stripe handles all PCI compliance
2. **Store only references**: `stripeCustomerId`, `subscriptionId`
3. **Use metadata**: Link Stripe objects to internal users via metadata
4. **Audit logging**: Log all subscription changes

### Price ID Management

```typescript
// Environment-based price IDs
const PRICES = {
  development: {
    monthly: 'price_test_monthly',
    yearly: 'price_test_yearly',
  },
  production: {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    yearly: process.env.STRIPE_PRICE_YEARLY,
  },
};

const prices = PRICES[process.env.NODE_ENV] || PRICES.development;
```
