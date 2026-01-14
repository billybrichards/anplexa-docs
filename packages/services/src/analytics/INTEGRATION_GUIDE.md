# Analytics Integration Guide

This guide shows how to integrate the unified analytics service into each Anplexa application.

## Migration from Existing Analytics

### From Companion App (v0-ai-companion-prototype-main)

The companion app currently uses a custom analytics wrapper in `lib/analytics.ts`. Replace it with the unified service:

**Before:**
```typescript
import { analytics } from './lib/analytics';

analytics.messageSent(messageLength, isGuest, messageCount);
analytics.userSignedUp(email, method, funnel);
```

**After:**
```typescript
import { track, identify } from '@anplexa/services/analytics';

track('message_sent', {
  message_length: messageLength,
  is_guest: isGuest,
  message_count: messageCount,
});

identify(userId, { email });
track('user_signed_up', {
  email,
  method,
  funnel_persona: funnel,
});
```

### From Funnel App (Funnel-Forge)

The funnel app uses a similar pattern in `client/src/lib/analytics.ts`. Migration is straightforward:

**Before:**
```typescript
import { analytics } from '@/lib/analytics';

analytics.funnelPersonaSelected(persona, personaName);
analytics.funnelQuestionAnswered(persona, questionId, questionText, answer, ...);
analytics.planSelected(plan, email, persona);
```

**After:**
```typescript
import { track, identify } from '@anplexa/services/analytics';

track('funnel_persona_selected', {
  persona,
  persona_name: personaName,
});

track('funnel_question_answered', {
  persona,
  question_id: questionId,
  question_text: questionText,
  answer,
  answer_index: answerIndex,
  question_number: questionNumber,
  total_questions: totalQuestions,
});

track('plan_selected', {
  plan,
  persona,
  plan_price: plan === 'monthly' ? 2.99 : 11.99,
  plan_billing: plan === 'monthly' ? 'monthly' : 'yearly',
});
```

## Application-Specific Integration

### Companion App (Next.js + React)

1. **Install dependencies:**
```bash
npm install posthog-js
```

2. **Initialize in root layout or `_app.tsx`:**
```typescript
import { initializeAnalytics } from '@anplexa/services/analytics';

export default async function RootLayout({ children }) {
  // Initialize once on startup
  await initializeAnalytics({
    posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });

  return <html>{children}</html>;
}
```

3. **Track in components:**
```typescript
'use client';

import { track, identify } from '@anplexa/services/analytics';

export function ChatInterface() {
  const handleAuth = async (user) => {
    identify(user.id, {
      email: user.email,
      displayName: user.displayName,
      subscriptionStatus: user.subscriptionStatus,
    });

    track('user_logged_in', {
      email: user.email,
      method: 'email',
    });
  };

  const handleMessage = (message) => {
    track('message_sent', {
      message_length: message.length,
      is_guest: !user,
      message_count: conversationMessages.length,
    });
  };

  const handleUpgrade = () => {
    track('upgrade_clicked', {
      source: 'messaging_limit',
      plan: 'monthly',
    });
  };

  return (
    <div>
      {/* UI components */}
    </div>
  );
}
```

### Funnel App (Vite + React)

1. **Install dependencies:**
```bash
npm install posthog-js
```

2. **Initialize in `main.tsx`:**
```typescript
import { initializeAnalytics } from '@anplexa/services/analytics';

await initializeAnalytics({
  posthogKey: import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
  posthogHost: 'https://us.i.posthog.com',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

3. **Track funnel events:**
```typescript
import { track, identify } from '@anplexa/services/analytics';

export function FunnelFlow() {
  const handlePersonaSelection = (persona: string) => {
    track('funnel_persona_selected', {
      persona,
      persona_name: PERSONA_MAP[persona],
    });
  };

  const handleQuestionAnswer = (question, answer) => {
    track('funnel_question_answered', {
      persona: selectedPersona,
      question_id: question.id,
      question_text: question.text,
      answer,
      answer_index: question.options.indexOf(answer),
      question_number: currentQuestionIndex + 1,
      total_questions: questions.length,
    });
  };

  const handleEmailSubmit = (email: string) => {
    identify(email);
    track('email_submitted', {
      persona: selectedPersona,
      funnel_type: 'direct',
    });
  };

  const handleCheckout = (plan: string) => {
    track('checkout_initiated', {
      plan,
      persona: selectedPersona,
      payment_provider: 'stripe',
    });
  };

  const handleSuccess = (email: string, plan: string) => {
    track('registration_completed', {
      plan,
      funnel_source: funnelSource,
      conversion_type: 'paid',
    });
  };

  return (
    // Funnel UI with tracking calls
  );
}
```

### Backend API (Express.js)

1. **Install dependencies:**
```bash
npm install posthog-node
```

2. **Initialize in server startup:**
```typescript
import { initializeAnalytics, track, flush } from '@anplexa/services/analytics';

// Initialize on startup
await initializeAnalytics({
  posthogKey: process.env.POSTHOG_KEY,
  isServer: true,
});

// Use in route handlers
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const user = await createUser(email, password);

  // Track registration
  track('user_signed_up', {
    email,
    method: 'email',
  });

  res.json({ user });
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const response = await ai.chat(message);

  // Track message
  track('message_sent', {
    message_length: message.length,
    is_guest: !req.user,
    message_count: 1,
  });

  res.json({ response });
});

app.post('/api/stripe/webhook', async (req, res) => {
  const event = stripe.webhooks.constructEvent(...);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    track('checkout_completed', {
      plan: session.metadata.plan,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
    });
  }

  res.json({ received: true });
});

// Before shutdown
process.on('SIGTERM', async () => {
  await flush();
  process.exit(0);
});
```

## Event Mapping Reference

### Authentication

| Old Code | New Code |
|----------|----------|
| `analytics.userSignedUp(email, method, funnel)` | `track('user_signed_up', { email, method, funnel_persona: funnel })` |
| `analytics.userLoggedIn(email, method)` | `track('user_logged_in', { email, method })` |
| `analytics.userLoggedOut()` | `track('user_logged_out')` |
| `analytics.magicLinkSent(email)` | `track('magic_link_sent', { email })` |
| `analytics.magicLinkVerified(email)` | `track('magic_link_verified', { email })` |

### Messaging

| Old Code | New Code |
|----------|----------|
| `analytics.messageSent(length, isGuest, count)` | `track('message_sent', { message_length: length, is_guest: isGuest, message_count: count })` |
| `analytics.aiResponseReceived(length, time, isGuest)` | `track('ai_response_received', { response_length: length, response_time_ms: time, is_guest: isGuest })` |
| `analytics.newConversationStarted(isGuest)` | `track('new_conversation_started', { is_guest: isGuest })` |
| `analytics.conversationLoaded(count)` | `track('conversation_loaded', { message_count: count })` |

### Payments

| Old Code | New Code |
|----------|----------|
| `analytics.checkoutStarted(plan, price)` | `track('checkout_started', { plan, price })` |
| `analytics.checkoutCompleted(plan, customerId)` | `track('checkout_completed', { plan, stripe_customer_id: customerId })` |
| `analytics.subscriptionVerified(plan)` | `track('subscription_verified', { plan })` |
| `analytics.upgradeClicked(source, plan)` | `track('upgrade_clicked', { source, plan })` |

### Funnel

| Old Code | New Code |
|----------|----------|
| `analytics.funnelEntryViewed()` | `track('funnel_entry_viewed', { page: 'funnel_entry' })` |
| `analytics.funnelPersonaSelected(persona, name)` | `track('funnel_persona_selected', { persona, persona_name: name })` |
| `analytics.funnelQuestionViewed(...)` | `track('funnel_question_viewed', { persona, question_id, question_text, question_number, total_questions })` |
| `analytics.funnelQuestionAnswered(...)` | `track('funnel_question_answered', { persona, question_id, question_text, answer, answer_index, question_number, total_questions })` |
| `analytics.emailSubmitted(email, persona, type)` | `track('email_submitted', { persona, funnel_type: type })` then `identify(email)` |
| `analytics.planSelected(plan, email, persona)` | `track('plan_selected', { plan, persona, plan_price, plan_billing })` |
| `analytics.checkoutInitiated(plan, email, persona)` | `track('checkout_initiated', { plan, persona, payment_provider: 'stripe' })` |
| `analytics.registrationCompleted(email, plan, source)` | `track('registration_completed', { plan, funnel_source: source, conversion_type: 'paid' })` |

### Onboarding

| Old Code | New Code |
|----------|----------|
| `analytics.genderSelected(gender, isCustom)` | `track('gender_selected', { gender, is_custom: isCustom })` |
| `analytics.companionNameSet(hasCustom)` | `track('companion_name_set', { has_custom_name: hasCustom })` |
| `analytics.onboardingCompleted(gender, hasCustom)` | `track('onboarding_completed', { companion_gender: gender, has_custom_name: hasCustom })` |

### User Properties

| Old Code | New Code |
|----------|----------|
| `analytics.identify(userId, properties)` | `identify(userId, properties)` |
| `analytics.setUserProperties(props)` | `setUserProperties(props)` |
| `analytics.reset()` | `reset()` |

## Environment Configuration

### Companion App `.env.local`

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Funnel App `.env`

```bash
VITE_PUBLIC_POSTHOG_KEY=phc_xxx...
```

### Backend API `.env`

```bash
POSTHOG_KEY=phc_xxx...
POSTHOG_HOST=https://us.i.posthog.com
```

## Testing Integration

### Unit Tests

```typescript
import { track } from '@anplexa/services/analytics';
import { vi } from 'vitest';

describe('UserAuth', () => {
  it('tracks user signup', () => {
    const trackSpy = vi.spyOn(analytics, 'track');

    registerUser('user@example.com', 'password');

    expect(trackSpy).toHaveBeenCalledWith(
      'user_signed_up',
      expect.objectContaining({ email: 'user@example.com' })
    );
  });
});
```

### Manual Testing

1. Set valid PostHog key in environment variables
2. Run application
3. Check PostHog dashboard for events
4. Verify event properties match expectations

## Performance Tips

1. **Lazy initialize**: Delay analytics initialization until needed
2. **Batch events**: Let PostHog batch events automatically
3. **Flush on shutdown**: Always call `flush()` before process exit (server-side)
4. **Monitor overhead**: Analytics should have minimal performance impact

## Troubleshooting

### Events not appearing

1. Verify PostHog key is set and valid
2. Check PostHog project is active
3. Ensure `identify()` called before tracking authenticated events
4. Call `flush()` after tracking (server-side)

### Type errors

- Ensure properties match event definition
- Check for typos in event names
- Use `AnalyticsEvents` constant for event names

### Browser console warnings

- "PostHog key not configured" → Set `NEXT_PUBLIC_POSTHOG_KEY`
- "posthog-js not available" → Install `posthog-js` package

## Next Steps

1. Install `@anplexa/services` in your application
2. Follow the application-specific guide above
3. Replace old analytics calls with new unified API
4. Test in development
5. Deploy to staging/production

For more details, see the main [README.md](./README.md) file.
