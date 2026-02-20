# @anplexa/services - Service Integrations

Unified wrappers for external services used across Anplexa applications. These services provide type-safe, centralized management of Stripe payments, email delivery, and other integrations.

## Phase 1: Stripe & Email Services

### Stripe Payment Service

Complete payment processing integration including:
- **Checkout Sessions**: Create subscription and one-time payment checkouts
- **Subscriptions**: Manage customer subscriptions (create, update, cancel, change plans)
- **Customers**: Create and manage Stripe customer records
- **Products & Pricing**: Access product and price information
- **Billing Portal**: Generate customer billing portal sessions for self-service management
- **Webhook Handling**: Process and handle Stripe webhook events

#### Stripe Modules

##### `stripe/client.ts`
Manages Stripe SDK initialization and credential handling.

```typescript
import {
  getStripeClient,
  getUncachableStripeClient,
  getStripePublishableKey,
  getStripeSecretKey,
  clearCache
} from '@anplexa/services';

// Get cached client instance
const stripe = await getStripeClient();

// Get a fresh client (not cached)
const freshClient = await getUncachableStripeClient();

// Get API keys
const publishKey = await getStripePublishableKey();
const secretKey = await getStripeSecretKey();

// Clear caches (useful for testing)
clearCache();
```

**Credentials**:
- Environment variables: `STRIPE_SECRET`, `STRIPE_PUBLIC`
- Replit connectors: Automatically uses Replit connector for `stripe` if env vars not set

##### `stripe/checkout.ts`
Handles checkout session creation for subscriptions and one-time payments.

```typescript
import {
  createCheckoutSession,
  createOneTimeCheckoutSession,
  getCheckoutSession,
  listCheckoutSessions,
  expireCheckoutSession
} from '@anplexa/services';

// Create subscription checkout
const session = await createCheckoutSession(
  'price_1Sj3Q4Hf3F7YsE79EfGL6BuF', // Price ID
  'https://anplexa.com/success',      // Success URL
  'https://anplexa.com/cancel',       // Cancel URL
  {
    customerId: 'cus_123',
    userId: 'user-456',
    metadata: { plan: 'monthly' }
  }
);

// Create one-time payment checkout
const paymentSession = await createOneTimeCheckoutSession(
  'price_premium_one_time',
  'https://anplexa.com/success',
  'https://anplexa.com/cancel'
);

// Retrieve session details
const details = await getCheckoutSession('cs_test_123');

// List sessions
const sessions = await listCheckoutSessions(10);

// Expire a session
await expireCheckoutSession('cs_test_123');
```

##### `stripe/subscription.ts`
Complete subscription and customer lifecycle management.

```typescript
import {
  createCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getSubscription,
  listCustomerSubscriptions,
  updateSubscription,
  cancelSubscription,
  scheduleSubscriptionCancellation,
  unscheduleSubscriptionCancellation,
  changeSubscriptionPrice,
  createBillingPortalSession,
  getProduct,
  listProducts,
  getPrice,
  listPricesForProduct,
  listPrices
} from '@anplexa/services';

// Customer management
const customer = await createCustomer('user@example.com', {
  name: 'John Doe',
  userId: 'user-123',
  metadata: { cohort: 'early-access' }
});

const existing = await getCustomer('cus_123');
await updateCustomer('cus_123', { name: 'Jane Doe' });
await deleteCustomer('cus_123');

// Subscription operations
const subscription = await getSubscription('sub_123');
const subs = await listCustomerSubscriptions('cus_123', { status: 'active' });

// Update subscription
await updateSubscription('sub_123', {
  metadata: { plan_tier: 'premium' }
});

// Cancel immediately
await cancelSubscription('sub_123');

// Schedule cancellation at period end
await scheduleSubscriptionCancellation('sub_123');
await unscheduleSubscriptionCancellation('sub_123');

// Change pricing plan
await changeSubscriptionPrice('sub_123', 'price_new_monthly', {
  billingCycleAnchor: 'now',
  prorationBehavior: 'create_prorations'
});

// Billing portal for customer self-service
const portal = await createBillingPortalSession(
  'cus_123',
  'https://anplexa.com/billing-return'
);

// Product and pricing information
const product = await getProduct('prod_123');
const products = await listProducts({ active: true, limit: 20 });
const price = await getPrice('price_123');
const prices = await listPricesForProduct('prod_123');
const allPrices = await listPrices({ active: true });
```

##### `stripe/webhook.ts`
Webhook event construction and handling helpers.

```typescript
import {
  constructWebhookEvent,
  processWebhook,
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  isSubscriptionActive,
  isSubscriptionCanceled
} from '@anplexa/services';

// In your webhook endpoint (must be registered BEFORE express.json())
app.post('/api/stripe/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const payload = req.body; // Raw buffer, not parsed JSON

  try {
    const event = await constructWebhookEvent(payload, signature);

    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutData = handleCheckoutCompleted(event.data.object);
        // Update user subscription in database
        break;

      case 'customer.subscription.created':
        const subData = handleSubscriptionCreated(event.data.object);
        // Store subscription in database
        break;

      case 'customer.subscription.updated':
        const updateData = handleSubscriptionUpdated(event.data.object);
        // Update subscription status
        break;

      case 'customer.subscription.deleted':
        const deleteData = handleSubscriptionDeleted(event.data.object);
        // Deactivate user account
        break;

      case 'invoice.paid':
        const invoiceData = handleInvoicePaid(event.data.object);
        // Log payment, send receipt email
        break;

      case 'invoice.payment_failed':
        const failData = handleInvoicePaymentFailed(event.data.object);
        // Alert user, retry later
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Invalid webhook' });
  }
});

// Helper functions for status checking
const isActive = isSubscriptionActive('active');
const isCanceled = isSubscriptionCanceled('canceled');
```

---

### Email Service

Complete email delivery integration including:
- **Templates**: Pre-designed, customizable email templates with Anplexa branding
- **Sending**: Send emails with support for attachments, CC, BCC, and tags
- **Batch Operations**: Send multiple emails efficiently
- **Retry Logic**: Automatic retry with exponential backoff
- **Validation**: Email address validation and sanitization

#### Email Modules

##### `email/client.ts`
Manages Resend SDK initialization and credential handling.

```typescript
import {
  getResendClient,
  getFromEmail,
  clearCache
} from '@anplexa/services';

// Get Resend client
const client = await getResendClient();

// Get configured from email address
const fromEmail = await getFromEmail();

// Clear caches (useful for testing)
clearCache();
```

**Credentials**:
- Environment variables: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Replit connectors: Automatically uses Replit connector for `resend` if env vars not set

##### `email/templates.ts`
Pre-designed email templates with Anplexa branding.

```typescript
import {
  welcomeEmail,
  subscriptionConfirmationEmail,
  passwordResetEmail,
  magicLinkEmail,
  emailVerificationEmail,
  refundConfirmationEmail,
  trialExpiringEmail,
  invoiceEmail,
  paymentFailedEmail,
  subscriptionCanceledEmail,
  customEmail,
  wrapEmail,
  buildTrackingUrl
} from '@anplexa/services';

// Use pre-built templates
const welcome = welcomeEmail('John Doe');
// { subject: 'Welcome to Anplexa', html: '...' }

const confirmation = subscriptionConfirmationEmail('Jane', 'pro');
const reset = passwordResetEmail('https://anplexa.com/reset?token=abc');
const magic = magicLinkEmail('https://anplexa.com/magic?token=xyz');

// Create custom template with Anplexa styling
const custom = customEmail(
  'Special Offer',
  '<h2>Limited Time Offer</h2><p>50% off this month!</p>'
);

// Wrap custom content with Anplexa styling
const wrapped = wrapEmail('<p>My custom content</p>');

// Build tracking URLs for campaigns
const trackingUrl = buildTrackingUrl(
  'https://anplexa.com/dash',
  'welcome_campaign',
  'user-123'
);
```

##### `email/resend.ts`
Email sending with Resend integration.

```typescript
import {
  sendEmail,
  sendTemplateEmail,
  sendBatchEmails,
  sendEmailWithRetry,
  isValidEmail,
  sanitizeEmail
} from '@anplexa/services';

// Send simple email
const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>Welcome!</p>'
});

// Send with options
const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>Welcome!</p>',
  replyTo: 'support@anplexa.com',
  cc: ['manager@anplexa.com'],
  bcc: ['log@anplexa.com'],
  tags: [
    { name: 'type', value: 'welcome' },
    { name: 'userId', value: 'user-123' }
  ]
});

// Send using template
const template = welcomeEmail('John');
const result = await sendTemplateEmail('john@example.com', template);

// Send batch emails
const results = await sendBatchEmails([
  { to: 'user1@example.com', subject: 'Email 1', html: '<p>1</p>' },
  { to: 'user2@example.com', subject: 'Email 2', html: '<p>2</p>' }
]);

// Send with automatic retry
const result = await sendEmailWithRetry(
  {
    to: 'user@example.com',
    subject: 'Important',
    html: '<p>This will retry 3 times</p>'
  },
  3,      // max retries
  1000    // delay in ms
);

// Validate and sanitize emails
if (isValidEmail('test@example.com')) {
  const clean = sanitizeEmail('  TEST@EXAMPLE.COM  ');
  // 'test@example.com'
}
```

---

## Configuration

### Environment Variables

#### Stripe
```bash
# Required
STRIPE_SECRET=sk_live_xxxxx
STRIPE_PUBLIC=pk_live_xxxxx

# Webhook handling
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Optional: Price IDs for your products
STRIPE_PRICE_MONTHLY=price_xxxxx
STRIPE_PRICE_YEARLY=price_xxxxx
```

#### Email (Resend)
```bash
# Required
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@anplexa.com
```

### Replit Connectors

If running on Replit, the services automatically detect and use Replit connectors:
- `stripe`: Stripe connector
- `resend`: Resend connector

Connectors are preferred for automatic credential rotation in production.

---

## Type Safety

All services are fully typed with TypeScript. Import types when needed:

```typescript
import type {
  CheckoutSessionOptions,
  SendEmailOptions,
  SendEmailResult,
  EmailTemplate,
  StripeWebhookEvent
} from '@anplexa/services';
```

---

## Testing

Unit tests are included with mocked SDKs:

```bash
npm run test
```

### Mocking in Your Tests

```typescript
import { vi } from 'vitest';
import * as stripeService from '@anplexa/services';

// Clear caches before each test
beforeEach(() => {
  stripeService.clearCache();
  process.env.STRIPE_SECRET = 'sk_test_123';
  process.env.STRIPE_PUBLIC = 'pk_test_123';
});

// Mock environment
afterEach(() => {
  vi.clearAllMocks();
  delete process.env.STRIPE_SECRET;
  delete process.env.STRIPE_PUBLIC;
});
```

---

## Error Handling

Services throw errors for critical failures. Always wrap calls in try-catch:

```typescript
try {
  const session = await createCheckoutSession(
    priceId,
    successUrl,
    cancelUrl
  );
} catch (error) {
  console.error('Checkout failed:', error);
  // Handle error appropriately
}
```

Email service returns result objects with success/error fields:

```typescript
const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Test',
  html: '<p>Test</p>'
});

if (!result.success) {
  console.error('Email failed:', result.error);
}
```

---

## Best Practices

### Stripe

1. **Always verify webhooks** with signature verification before processing
2. **Store stripe_customer_id** and **stripe_subscription_id** in user records
3. **Use idempotency keys** for critical operations (built into Stripe SDK)
4. **Handle webhook retries** - Stripe will retry failed webhooks
5. **Log all transactions** for audit trails
6. **Respect metadata** limits (50 key/value pairs per object)

### Email

1. **Validate emails** before sending with `isValidEmail()`
2. **Use templates** for consistent branding
3. **Add tags** for campaign tracking and analytics
4. **Implement retry logic** for transactional emails
5. **Monitor bounce rates** and unsubscribes
6. **Use reply-to addresses** for customer support routing
7. **Test templates** in different email clients

---

## Roadmap

Phase 2 services planned:
- Authentication (JWT, OAuth, Magic Links)
- Analytics (PostHog integration)
- AI Provider abstraction
- SMS notifications
- Webhooks management

---

## Support

For issues or questions:
1. Check the source code in `packages/services/src/`
2. Review unit tests for usage examples
3. Check environment variables are configured
4. Enable debug logging with `DEBUG=*`
