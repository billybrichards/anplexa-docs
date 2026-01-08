---
sidebar_position: 5
---

# Stripe API

Endpoints for payment processing, subscription management, and Stripe webhook handling.

## Overview

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/stripe/checkout` | POST | Access Token | Create Stripe checkout session |
| `/api/stripe/customer` | GET | Access Token | Get customer details |
| `/api/stripe/webhook` | POST | Stripe Signature | Handle Stripe webhook events |
| `/api/stripe/portal` | POST | Access Token | Create customer portal session |
| `/api/subscription` | GET | Access Token | Get subscription status |

---

## Create Checkout Session

Create a Stripe Checkout session to start a subscription.

```
POST /api/stripe/checkout
```

### Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Request

```json
{
  "priceId": "monthly",
  "successUrl": "https://app.anplexa.com/success",
  "cancelUrl": "https://app.anplexa.com/pricing"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `priceId` | string | Yes | Plan identifier: `monthly` or `yearly` |
| `successUrl` | string | Yes | Redirect URL after successful payment |
| `cancelUrl` | string | Yes | Redirect URL if user cancels checkout |

### Response

**200 OK**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_live_..."
}
```

**400 Bad Request** (Already subscribed)
```json
{
  "error": "Already subscribed",
  "code": "ALREADY_SUBSCRIBED"
}
```

**400 Bad Request** (Invalid price)
```json
{
  "error": "Invalid price ID",
  "code": "INVALID_PRICE"
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid or expired token"
}
```

### Price Configuration

Prices are configured via environment variables:

| Plan | Environment Variable | Default Price |
|------|---------------------|---------------|
| Monthly | `STRIPE_PRICE_MONTHLY` | £2.99/month |
| Yearly Early Believer | `STRIPE_PRICE_YEARLY` | £11.99/year |

### Checkout Session Metadata

The created checkout session includes metadata for webhook processing:

```json
{
  "customer_email": "user@example.com",
  "metadata": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "source": "companions_app"
  },
  "subscription_data": {
    "metadata": {
      "userId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

---

## Get Customer Details

Retrieve the authenticated user's Stripe customer information.

```
GET /api/stripe/customer
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Response

**200 OK** (Has Stripe customer)
```json
{
  "customerId": "cus_ABC123XYZ",
  "email": "user@example.com",
  "subscriptions": [
    {
      "id": "sub_123456789",
      "status": "active",
      "currentPeriodEnd": "2025-02-08T12:00:00.000Z",
      "cancelAtPeriodEnd": false,
      "plan": {
        "id": "price_monthly_abc",
        "amount": 299,
        "currency": "gbp",
        "interval": "month"
      }
    }
  ],
  "defaultPaymentMethod": {
    "id": "pm_123",
    "brand": "visa",
    "last4": "4242",
    "expMonth": 12,
    "expYear": 2027
  }
}
```

**200 OK** (No Stripe customer)
```json
{
  "customerId": null,
  "email": "user@example.com",
  "subscriptions": [],
  "defaultPaymentMethod": null
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid or expired token"
}
```

---

## Handle Stripe Webhook

Receive and process Stripe webhook events.

```
POST /api/stripe/webhook
```

:::warning Critical Security
This endpoint must receive the raw request body (not JSON-parsed) to verify the Stripe signature. The webhook secret must be kept confidential.
:::

### Headers

```
Content-Type: application/json
stripe-signature: t=1704720000,v1=abc123...,v0=def456...
```

### Request

Raw webhook event from Stripe (verified via signature).

### Response

**200 OK**
```json
{
  "received": true
}
```

**400 Bad Request** (Invalid signature)
```json
{
  "error": "Invalid webhook signature"
}
```

**400 Bad Request** (Missing signature)
```json
{
  "error": "Missing stripe-signature header"
}
```

### Handled Event Types

| Event | Trigger | Action |
|-------|---------|--------|
| `checkout.session.completed` | Payment successful | Create/link Stripe customer, activate subscription |
| `customer.subscription.created` | New subscription | Update user subscription status to `active` |
| `customer.subscription.updated` | Plan change, renewal | Update plan type and subscription status |
| `customer.subscription.deleted` | Cancellation complete | Set subscription status to `cancelled` |
| `invoice.paid` | Successful recurring payment | Log payment, extend access period |
| `invoice.payment_failed` | Failed payment attempt | Set status to `past_due`, send notification email |

### Webhook Event Structure

**checkout.session.completed**
```json
{
  "id": "evt_123",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_live_abc123",
      "customer": "cus_XYZ789",
      "customer_email": "user@example.com",
      "subscription": "sub_456",
      "metadata": {
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "source": "companions_app"
      },
      "payment_status": "paid"
    }
  }
}
```

**customer.subscription.updated**
```json
{
  "id": "evt_456",
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_123",
      "customer": "cus_XYZ789",
      "status": "active",
      "current_period_end": 1707393600,
      "cancel_at_period_end": false,
      "items": {
        "data": [
          {
            "price": {
              "id": "price_monthly_abc",
              "unit_amount": 299,
              "currency": "gbp",
              "recurring": {
                "interval": "month"
              }
            }
          }
        ]
      },
      "metadata": {
        "userId": "550e8400-e29b-41d4-a716-446655440000"
      }
    }
  }
}
```

**invoice.payment_failed**
```json
{
  "id": "evt_789",
  "type": "invoice.payment_failed",
  "data": {
    "object": {
      "id": "in_123",
      "customer": "cus_XYZ789",
      "subscription": "sub_456",
      "attempt_count": 1,
      "next_payment_attempt": 1704892800
    }
  }
}
```

### Webhook Processing Flow

```typescript
// Webhook handler pseudocode
switch (event.type) {
  case 'checkout.session.completed':
    const session = event.data.object;
    // Link Stripe customer to user
    await db.update(users)
      .set({
        stripeCustomerId: session.customer,
        subscriptionStatus: 'active'
      })
      .where(eq(users.id, session.metadata.userId));
    break;

  case 'customer.subscription.updated':
    const subscription = event.data.object;
    await db.update(users)
      .set({
        subscriptionStatus: subscription.status,
        subscriptionEndsAt: subscription.cancel_at_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null
      })
      .where(eq(users.stripeCustomerId, subscription.customer));
    break;

  case 'customer.subscription.deleted':
    await db.update(users)
      .set({ subscriptionStatus: 'cancelled' })
      .where(eq(users.stripeCustomerId, event.data.object.customer));
    break;

  case 'invoice.payment_failed':
    await db.update(users)
      .set({ subscriptionStatus: 'past_due' })
      .where(eq(users.stripeCustomerId, event.data.object.customer));
    // Send payment failed notification email
    await emailService.sendPaymentFailedEmail(user.email);
    break;
}
```

---

## Create Customer Portal Session

Create a Stripe Customer Portal session for subscription management.

```
POST /api/stripe/portal
```

### Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Request

```json
{
  "returnUrl": "https://app.anplexa.com/account"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `returnUrl` | string | Yes | URL to redirect after portal session |

### Response

**200 OK**
```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

**400 Bad Request** (No Stripe customer)
```json
{
  "error": "No subscription found",
  "code": "NO_SUBSCRIPTION"
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid or expired token"
}
```

### Portal Capabilities

The customer portal allows users to:

- View subscription details
- Update payment method
- Download invoices
- Cancel subscription
- Switch plans (if configured)

---

## Get Subscription Status

Get the current subscription status for the authenticated user.

```
GET /api/subscription
```

### Headers

```
Authorization: Bearer {accessToken}
```

### Response

**200 OK** (Active subscription)
```json
{
  "status": "active",
  "plan": "monthly",
  "planName": "Monthly",
  "price": 299,
  "currency": "gbp",
  "currentPeriodEnd": "2025-02-08T12:00:00.000Z",
  "cancelAtPeriodEnd": false,
  "features": {
    "unlimitedMessages": true,
    "prioritySupport": false
  }
}
```

**200 OK** (Cancelled but active until period end)
```json
{
  "status": "active",
  "plan": "yearly",
  "planName": "Early Believer",
  "price": 1199,
  "currency": "gbp",
  "currentPeriodEnd": "2026-01-08T12:00:00.000Z",
  "cancelAtPeriodEnd": true,
  "endsAt": "2026-01-08T12:00:00.000Z",
  "features": {
    "unlimitedMessages": true,
    "prioritySupport": true
  }
}
```

**200 OK** (No subscription)
```json
{
  "status": "inactive",
  "plan": null,
  "planName": null,
  "features": {
    "unlimitedMessages": false,
    "prioritySupport": false
  }
}
```

**200 OK** (Past due)
```json
{
  "status": "past_due",
  "plan": "monthly",
  "planName": "Monthly",
  "message": "Payment failed. Please update your payment method.",
  "features": {
    "unlimitedMessages": true,
    "prioritySupport": false
  }
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid or expired token"
}
```

### Subscription Status Values

| Status | Description | Access Level |
|--------|-------------|--------------|
| `active` | Active paid subscription | Full access |
| `trialing` | Trial period (if applicable) | Full access |
| `past_due` | Payment failed, grace period | Full access (temporary) |
| `cancelled` | Subscription cancelled | Access until period end |
| `inactive` | No subscription | Guest mode (6 messages) |

---

## Plans Reference

### Available Plans

| Plan | ID | Price | Billing Cycle | Features |
|------|------|-------|---------------|----------|
| Monthly | `monthly` | £2.99 | Monthly | Unlimited messages |
| Early Believer | `yearly` | £11.99 | Yearly | Unlimited messages, priority support |

### Plan Features Matrix

| Feature | Free/Guest | Monthly | Early Believer |
|---------|------------|---------|----------------|
| Messages | 6 total | Unlimited | Unlimited |
| Conversation history | No | Yes | Yes |
| Personality modes | Default only | All | All |
| Response length control | No | Yes | Yes |
| Priority support | No | No | Yes |
| Early access features | No | No | Yes |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `INVALID_PRICE` | 400 | Price ID not recognized |
| `ALREADY_SUBSCRIBED` | 400 | User already has active subscription |
| `NO_SUBSCRIPTION` | 400 | No Stripe customer/subscription found |
| `UNAUTHORIZED` | 401 | Invalid or missing access token |
| `WEBHOOK_SIGNATURE_INVALID` | 400 | Stripe signature verification failed |
| `STRIPE_ERROR` | 500 | Stripe API error |

---

## Security Considerations

### Webhook Signature Verification

:::danger Always Verify Webhooks
Never process webhook events without verifying the `stripe-signature` header. Unverified webhooks could be forged by attackers.
:::

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post('/api/stripe/webhook',
  express.raw({ type: 'application/json' }), // Raw body required
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );

      // Process verified event
      await handleWebhookEvent(event);

      res.json({ received: true });
    } catch (err) {
      console.error('Webhook verification failed:', err.message);
      res.status(400).json({ error: 'Invalid webhook signature' });
    }
  }
);
```

### Idempotency

Webhook events may be delivered multiple times. Always handle events idempotently:

```typescript
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  // Check if already processed
  const existing = await db.query.users.findFirst({
    where: eq(users.stripeCustomerId, session.customer)
  });

  if (existing?.subscriptionStatus === 'active') {
    // Already processed, skip
    return;
  }

  // Process the event
  await db.update(users)
    .set({
      stripeCustomerId: session.customer,
      subscriptionStatus: 'active'
    })
    .where(eq(users.id, session.metadata.userId));
}
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint signing secret | Yes |
| `STRIPE_PRICE_MONTHLY` | Monthly plan price ID | Yes |
| `STRIPE_PRICE_YEARLY` | Yearly plan price ID | Yes |

:::warning Production Keys
Never use test keys (`sk_test_*`) in production. Use live keys (`sk_live_*`) and separate webhook secrets for each environment.
:::

### Data Storage Best Practices

1. **Never store card details**: Stripe handles all PCI compliance
2. **Store only references**: `stripeCustomerId`, `subscriptionId`
3. **Use metadata**: Link Stripe objects to internal users
4. **Audit logging**: Log all subscription state changes

```typescript
// What to store in your database
interface UserSubscriptionData {
  stripeCustomerId: string | null;      // cus_XXX
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt: Date | null;      // For cancelled subscriptions
  // Never store: card numbers, CVV, full card details
}
```

---

## Testing

### Test Mode

Use Stripe test mode for development:

- API Key: `sk_test_...`
- Webhook Secret: From Stripe Dashboard (test mode)
- Test Cards: See [Stripe Testing Docs](https://stripe.com/docs/testing)

### Common Test Cards

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 3220` | 3D Secure required |
| `4000 0000 0000 9995` | Insufficient funds |

### Webhook Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```
