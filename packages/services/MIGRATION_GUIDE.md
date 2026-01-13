# Migration Guide: Using @anplexa/services

This guide shows how to migrate existing code from backend-specific implementations to the unified `@anplexa/services` package.

---

## Stripe Migration

### Before: Backend API Code
```typescript
// Old: server/infrastructure/stripe/stripeService.ts
import { getUncachableStripeClient } from './stripeClient.js';
import { storage } from './storage.js';

export class StripeService {
  async createCustomer(email: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { userId },
    });
  }

  async createCheckoutSession(customerId: string, priceId: string, ...) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({...});
  }
}

export const stripeService = new StripeService();

// Usage in routes
const session = await stripeService.createCheckoutSession(
  customerId,
  priceId,
  successUrl,
  cancelUrl
);
```

### After: Using @anplexa/services
```typescript
// New: Use unified service
import {
  createCustomer,
  createCheckoutSession
} from '@anplexa/services';

// Same functionality, cleaner API
const customer = await createCustomer(email, { userId });

const session = await createCheckoutSession(
  priceId,
  successUrl,
  cancelUrl,
  { customerId }
);
```

### Migration Steps

1. **Remove local Stripe files**:
   ```bash
   rm server/infrastructure/stripe/stripeClient.ts
   rm server/infrastructure/stripe/stripeService.ts
   rm server/infrastructure/stripe/storage.ts
   ```

2. **Update imports**:
   ```typescript
   // Before
   import { stripeService } from './infrastructure/stripe/stripeService.js';

   // After
   import { createCheckoutSession, getSubscription } from '@anplexa/services';
   ```

3. **Update method calls**:
   ```typescript
   // Before
   await stripeService.createCheckoutSession(customerId, priceId, url1, url2);

   // After
   await createCheckoutSession(priceId, url1, url2, { customerId });
   ```

4. **Webhook handling**:
   ```typescript
   // Before
   import { WebhookHandlers } from './infrastructure/stripe/webhookHandlers.js';
   await WebhookHandlers.processWebhook(payload, signature);

   // After
   import { constructWebhookEvent, handleCheckoutCompleted } from '@anplexa/services';
   const event = await constructWebhookEvent(payload, signature);
   const data = handleCheckoutCompleted(event.data.object);
   ```

---

## Email Migration

### Before: Backend API Code
```typescript
// Old: server/infrastructure/email/resendService.ts
import { Resend } from 'resend';

async function getResendClient() {
  const { apiKey } = await getCredentials();
  return new Resend(apiKey);
}

export const emailService = {
  async sendWelcomeEmail(to: string, displayName: string) {
    const { client, fromEmail } = await getResendClient();
    await client.emails.send({
      from: fromEmail,
      to,
      subject: 'Welcome to Abionti API',
      html: `...template...`,
    });
  }
};

// Usage in routes
await emailService.sendWelcomeEmail(userEmail, displayName);
```

### After: Using @anplexa/services
```typescript
// New: Use unified service
import {
  welcomeEmail,
  sendTemplateEmail
} from '@anplexa/services';

// Cleaner, reusable templates
const template = welcomeEmail(displayName);
await sendTemplateEmail(userEmail, template);
```

### Migration Steps

1. **Remove local email files**:
   ```bash
   rm server/infrastructure/email/resendService.ts
   rm server/infrastructure/email/emailTemplates.ts
   rm server/infrastructure/email/emailScheduler.ts
   ```

2. **Update imports**:
   ```typescript
   // Before
   import { emailService } from './infrastructure/email/resendService.js';

   // After
   import {
     welcomeEmail,
     passwordResetEmail,
     sendTemplateEmail
   } from '@anplexa/services';
   ```

3. **Update email sending**:
   ```typescript
   // Before
   await emailService.sendWelcomeEmail(email, name);

   // After
   const template = welcomeEmail(name);
   await sendTemplateEmail(email, template);
   ```

4. **Custom emails**:
   ```typescript
   // Before
   await emailService.sendRawEmail(email, subject, html);

   // After
   import { customEmail, sendTemplateEmail } from '@anplexa/services';
   const template = customEmail(subject, html);
   await sendTemplateEmail(email, template);
   ```

5. **Email with tracking**:
   ```typescript
   // Before (manual building)
   const trackingUrl = `${baseUrl}?src=email&campaign=welcome&uid=${userId}`;

   // After (helper function)
   import { buildTrackingUrl } from '@anplexa/services';
   const trackingUrl = buildTrackingUrl(baseUrl, 'welcome', userId);
   ```

---

## Webhook Endpoint Migration

### Before: Backend API
```typescript
// server/presentation/routes/stripeRoutes.ts
import { WebhookHandlers } from '../infrastructure/stripe/webhookHandlers.js';

app.post('/api/stripe/webhook', async (req, res) => {
  try {
    await WebhookHandlers.processWebhook(
      req.body,
      req.headers['stripe-signature']
    );
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: 'Webhook error' });
  }
});
```

### After: Using @anplexa/services
```typescript
// server/presentation/routes/stripeRoutes.ts
import {
  constructWebhookEvent,
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleInvoicePaid
} from '@anplexa/services';

app.post('/api/stripe/webhook', async (req, res) => {
  try {
    const event = await constructWebhookEvent(
      req.body,
      req.headers['stripe-signature']
    );

    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutData = handleCheckoutCompleted(event.data.object);
        // Update subscription in database
        await db.update(users).set({
          stripeCustomerId: checkoutData.customerId,
          stripeSubscriptionId: checkoutData.subscriptionId,
        });
        break;

      case 'customer.subscription.created':
        const subData = handleSubscriptionCreated(event.data.object);
        // Update user subscription status
        break;

      case 'invoice.paid':
        const invoiceData = handleInvoicePaid(event.data.object);
        // Log payment
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Invalid webhook' });
  }
});
```

---

## Funnel App Migration

### Before: Funnel-Specific Code
```typescript
// Funnel-Forge/server/routes.ts
import Stripe from 'stripe';
const stripe = new Stripe(stripeSecretKey);

app.get('/api/stripe/checkout', async (req, res) => {
  const { plan, email } = req.query;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { email, plan }
  });

  res.redirect(303, session.url);
});
```

### After: Using @anplexa/services
```typescript
// Funnel-Forge/server/routes.ts
import { createCheckoutSession } from '@anplexa/services';

app.get('/api/stripe/checkout', async (req, res) => {
  const { plan, email } = req.query;

  const session = await createCheckoutSession(
    priceId,
    successUrl,
    cancelUrl,
    {
      customerEmail: email,
      metadata: { plan: plan as string }
    }
  );

  res.redirect(303, session.url!);
});
```

---

## Testing Migration

### Before: Testing with Local Implementation
```typescript
// server/__tests__/stripe.test.ts
import { stripeService } from '../infrastructure/stripe/stripeService.js';

vi.mock('../infrastructure/stripe/stripeClient.ts', () => ({
  getUncachableStripeClient: vi.fn(() => mockStripeClient)
}));

it('should create checkout session', async () => {
  const session = await stripeService.createCheckoutSession(
    'cus_123',
    'price_123',
    'url1',
    'url2'
  );
  expect(session.id).toBe('cs_test_123');
});
```

### After: Testing with Unified Service
```typescript
// __tests__/stripe.test.ts
import { createCheckoutSession } from '@anplexa/services';

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripeClient)
}));

it('should create checkout session', async () => {
  const session = await createCheckoutSession(
    'price_123',
    'url1',
    'url2',
    { customerId: 'cus_123' }
  );
  expect(session.id).toBe('cs_test_123');
});
```

---

## Database Schema Considerations

### Stripe Customer Fields
Ensure your user schema includes these fields:
```sql
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255);
```

### Email Queue
If using email queue for scheduling:
```typescript
// Instead of storing in queue, use Resend's scheduling
// This is a breaking change - plan accordingly
```

---

## Configuration Migration

### Environment Variables
**Before**: Scattered across different services
**After**: Consolidated in one place

```bash
# Add to your .env file
STRIPE_SECRET=sk_live_xxxxx
STRIPE_PUBLIC=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_MONTHLY=price_xxxxx
STRIPE_PRICE_YEARLY=price_xxxxx

RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@anplexa.com
```

### Replit Configuration
If running on Replit:
- Configure Stripe connector once (used by all apps)
- Configure Resend connector once (used by all apps)
- Services automatically detect and use connectors

---

## Breaking Changes

1. **Email Methods Changed**:
   ```typescript
   // Old: emailService.sendWelcomeEmail(email, name)
   // New: sendTemplateEmail(email, welcomeEmail(name))
   ```

2. **Stripe Client API**:
   ```typescript
   // Old: stripeService.createCheckoutSession(customerId, priceId, ...)
   // New: createCheckoutSession(priceId, url1, url2, { customerId, ... })
   ```

3. **No Class Instances**:
   - Old: `stripeService.method()`
   - New: `import { method } from '@anplexa/services'`

4. **Webhook Processing**:
   ```typescript
   // Old: WebhookHandlers.processWebhook(payload, sig)
   // New: constructWebhookEvent(payload, sig)
   ```

---

## Gradual Migration Strategy

If you have a large codebase, migrate gradually:

### Phase 1: Add Imports
```typescript
import { createCheckoutSession } from '@anplexa/services';
// Keep old imports alongside
```

### Phase 2: Replace Usage
```typescript
// Replace one function at a time
const session = await createCheckoutSession(...);
```

### Phase 3: Remove Old Code
```typescript
// After all usages updated, remove old files
rm server/infrastructure/stripe/stripeService.ts
```

---

## Verification Checklist

After migration:

- [ ] All imports resolve correctly
- [ ] Tests pass with new services
- [ ] Webhook signatures verify correctly
- [ ] Emails send successfully
- [ ] Subscriptions create/update properly
- [ ] No "module not found" errors
- [ ] TypeScript types are satisfied
- [ ] Staging environment works
- [ ] Production environment works

---

## Support

For migration issues:

1. Check `SERVICES.md` for complete API documentation
2. Review test files for usage examples
3. Check source code in `packages/services/src/`
4. Look at `PHASE1_EXTRACTION_SUMMARY.md` for detailed structure

---

**Last Updated**: 2026-01-13
**Service Version**: Phase 1
**Status**: Ready for Migration
