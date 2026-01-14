# @anplexa/services - Phase 1 Extraction Complete

Welcome! This document helps you navigate the newly created Stripe and Email services.

## Quick Navigation

### For Getting Started
1. **First time?** Start with `SERVICES.md` - Complete API reference
2. **Migrating existing code?** Read `MIGRATION_GUIDE.md` - Before/after examples
3. **Want project details?** Check `PHASE1_EXTRACTION_SUMMARY.md` - Full breakdown

### For Development
- **Using Stripe?** See `src/stripe/` directory (4 modules)
- **Sending emails?** See `src/email/` directory (3 modules)
- **Writing tests?** Look at `src/stripe/stripe.test.ts` and `src/email/email.test.ts`

---

## Quick Examples

### Stripe - Create Subscription Checkout
```typescript
import { createCheckoutSession } from '@anplexa/services';

const session = await createCheckoutSession(
  'price_monthly_id',
  'https://app.anplexa.com/success',
  'https://app.anplexa.com/cancel',
  {
    customerId: 'cus_123',
    userId: 'user-456',
    metadata: { plan: 'monthly' }
  }
);

// Redirect user to session.url
```

### Email - Send Welcome Email
```typescript
import { welcomeEmail, sendTemplateEmail } from '@anplexa/services';

const template = welcomeEmail('John Doe');
const result = await sendTemplateEmail('john@example.com', template);

if (result.success) {
  console.log(`Email sent: ${result.messageId}`);
} else {
  console.error(`Failed: ${result.error}`);
}
```

### Handle Stripe Webhook
```typescript
import { constructWebhookEvent, handleCheckoutCompleted } from '@anplexa/services';

app.post('/api/stripe/webhook', async (req, res) => {
  const event = await constructWebhookEvent(
    req.body,
    req.headers['stripe-signature']
  );

  if (event.type === 'checkout.session.completed') {
    const data = handleCheckoutCompleted(event.data.object);
    // Update user subscription in database
  }

  res.json({ received: true });
});
```

---

## File Structure

```
packages/services/
├── src/
│   ├── stripe/              # Payment processing
│   │   ├── client.ts        # SDK & credentials
│   │   ├── checkout.ts      # Checkout sessions
│   │   ├── subscription.ts  # Customer & subscription management
│   │   ├── webhook.ts       # Event handling
│   │   ├── index.ts         # Exports
│   │   └── stripe.test.ts   # Unit tests
│   │
│   ├── email/               # Email delivery
│   │   ├── client.ts        # SDK & credentials
│   │   ├── templates.ts     # Email templates
│   │   ├── resend.ts        # Email sending
│   │   ├── index.ts         # Exports
│   │   └── email.test.ts    # Unit tests
│   │
│   └── index.ts             # Main exports
│
├── SERVICES.md              # API documentation (600+ lines)
├── PHASE1_EXTRACTION_SUMMARY.md  # Project details (400+ lines)
├── MIGRATION_GUIDE.md       # How to migrate (450+ lines)
├── README_PHASE1.md         # This file
└── package.json             # Dependencies
```

---

## Key Features

### Stripe (35+ functions)
✅ Checkout sessions (subscription & one-time)
✅ Customer management (create, update, delete)
✅ Subscription lifecycle (create, read, update, cancel)
✅ Plan changes & billing portal
✅ Product & pricing information
✅ Webhook signature verification
✅ Event handlers (10+ event types)
✅ Type-safe operations
✅ Automatic credential caching

### Email (25+ functions)
✅ 10 pre-designed templates
✅ Custom template wrapper
✅ Single & batch sending
✅ Automatic retry logic
✅ Email validation & sanitization
✅ Campaign tracking support
✅ CC/BCC & reply-to
✅ Email tagging for analytics
✅ Type-safe operations
✅ Automatic credential caching

---

## Configuration

### Environment Variables Required
```bash
# Stripe
STRIPE_SECRET=sk_live_xxxxx
STRIPE_PUBLIC=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@anplexa.com
```

### Optional
```bash
STRIPE_PRICE_MONTHLY=price_xxxxx
STRIPE_PRICE_YEARLY=price_xxxxx
```

---

## Usage Statistics

| Service | Functions | Tests | Lines |
|---------|-----------|-------|-------|
| **Stripe** | 35+ | 30+ | 900+ |
| **Email** | 25+ | 40+ | 1,000+ |
| **Tests** | - | 70+ | 800+ |
| **Docs** | - | - | 1,500+ |

---

## Common Tasks

### Task: Create Subscription for New User
```typescript
import {
  createCustomer,
  createCheckoutSession
} from '@anplexa/services';

// 1. Create customer
const customer = await createCustomer(userEmail, {
  name: displayName,
  userId: userId
});

// 2. Create checkout session
const session = await createCheckoutSession(
  priceId,
  successUrl,
  cancelUrl,
  { customerId: customer.id }
);

// 3. Redirect user
window.location.href = session.url;
```

### Task: Handle Subscription Update
```typescript
import { handleSubscriptionUpdated } from '@anplexa/services';

const event = await constructWebhookEvent(payload, sig);
const data = handleSubscriptionUpdated(event.data.object);

// Update database
await db.update(users).set({
  subscriptionStatus: data.isActive ? 'active' : 'inactive'
});
```

### Task: Send Multiple Emails
```typescript
import {
  welcomeEmail,
  sendBatchEmails
} from '@anplexa/services';

const emails = users.map(user => ({
  to: user.email,
  subject: welcomeEmail(user.name).subject,
  html: welcomeEmail(user.name).html
}));

const results = await sendBatchEmails(emails);
console.log(`Sent ${results.filter(r => r.success).length} emails`);
```

### Task: Send Email with Tracking
```typescript
import {
  customEmail,
  sendTemplateEmail,
  buildTrackingUrl
} from '@anplexa/services';

const trackUrl = buildTrackingUrl(
  'https://anplexa.com/dash',
  'campaign_name',
  userId
);

const template = customEmail(
  'Special Offer',
  `<p>Check this out: <a href="${trackUrl}">Click here</a></p>`
);

await sendTemplateEmail(email, template);
```

---

## Testing

### Run Tests
```bash
npm run test

# With watch mode
npm run test -- --watch

# Specific file
npm run test stripe.test.ts
```

### Example Test
```typescript
import { createCheckoutSession } from '@anplexa/services';

it('should create checkout session', async () => {
  const session = await createCheckoutSession(
    'price_test',
    'http://localhost/success',
    'http://localhost/cancel'
  );

  expect(session.url).toBeDefined();
  expect(session.id).toMatch(/^cs_/);
});
```

---

## Troubleshooting

### "No Stripe credentials available"
**Solution**: Set `STRIPE_SECRET` and `STRIPE_PUBLIC` environment variables

### "Webhook signature verification failed"
**Solution**: Ensure you're passing raw Buffer payload (not parsed JSON) and `STRIPE_WEBHOOK_SECRET` is correct

### "Email failed to send"
**Solution**: Check `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured

### "Tests failing"
**Solution**: Run `npm run test` - tests should pass with mocked SDKs. If not, check environment variables in test file.

---

## Next Steps

1. **Read** `SERVICES.md` for complete API documentation
2. **Review** `MIGRATION_GUIDE.md` if migrating from existing code
3. **Check** `PHASE1_EXTRACTION_SUMMARY.md` for project details
4. **Run** `npm run test` to verify everything works
5. **Integrate** into your application

---

## Support & Documentation

- **API Reference**: See `SERVICES.md`
- **Migration Help**: See `MIGRATION_GUIDE.md`
- **Project Details**: See `PHASE1_EXTRACTION_SUMMARY.md`
- **Code Examples**: Check `stripe.test.ts` and `email.test.ts`
- **Type Definitions**: Check exported interfaces in source files

---

## Phase 2 Planning

Future services to be added:
- Authentication (JWT, OAuth, Magic Links)
- Enhanced Analytics (PostHog integration)
- AI Provider abstraction
- SMS notifications
- Webhook management system

---

**Created**: 2026-01-13
**Status**: Production Ready
**Version**: Phase 1 Complete

