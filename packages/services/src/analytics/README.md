# Analytics Service (@anplexa/services/analytics)

Unified PostHog analytics wrapper providing type-safe event tracking across all Anplexa applications.

## Features

- **Type-Safe Event Tracking**: TypeScript-enforced event properties
- **Dual Environment Support**: Works in both browser (posthog-js) and Node.js (posthog-node)
- **Unified Event Schema**: Single source of truth for all tracked events
- **User Identification**: Track user profiles and properties
- **Error Handling**: Graceful degradation if PostHog unavailable
- **Zero Configuration**: Works without PostHog key (logs warning only)

## Installation

The analytics service is part of the `@anplexa/services` monorepo package.

```bash
# In your app package
npm install @anplexa/services
```

### PostHog Dependencies

You'll need one or both PostHog libraries depending on your environment:

```bash
# For browser applications
npm install posthog-js

# For Node.js server applications
npm install posthog-node
```

## Quick Start

### Browser Setup

```typescript
// In your root component or app initialization
import { initializeAnalytics, track } from '@anplexa/services/analytics';

// Initialize once at app startup
await initializeAnalytics({
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  posthogHost: 'https://us.i.posthog.com',
});

// Track events in your components
track('user_signed_up', {
  email: 'user@example.com',
  method: 'email',
  funnel_persona: 'curious',
});
```

### Server Setup

```typescript
// In your server initialization
import { initializeAnalytics, track } from '@anplexa/services/analytics';

// Initialize once at server startup
await initializeAnalytics({
  posthogKey: process.env.POSTHOG_KEY,
  isServer: true,
});

// Track events
await track('registration_completed', {
  plan: 'monthly',
  funnel_source: 'instagram',
  conversion_type: 'paid',
});

// Before shutdown, flush pending events
await flush();
```

## API Reference

### Initialization

#### `initializeAnalytics(config?: AnalyticsClientConfig)`

Initialize the global analytics client. Call once at application startup.

```typescript
await initializeAnalytics({
  posthogKey: 'phc_xxx...', // PostHog project key
  posthogHost: 'https://us.i.posthog.com', // PostHog instance
  environment: 'production',
  isServer: false, // auto-detected if not specified
});
```

### User Management

#### `identify(userId: string, properties?: UserProperties)`

Link events to a specific user.

```typescript
identify('user-123', {
  email: 'user@example.com',
  displayName: 'John Doe',
  subscriptionStatus: 'subscribed',
  plan: 'monthly',
});
```

#### `setUserProperties(properties: UserProperties)`

Update user profile without creating an event.

```typescript
setUserProperties({
  companionGender: 'female',
  onboardingCompleted: true,
});
```

#### `reset()`

Clear user identity (use on logout).

```typescript
reset();
```

### Event Tracking

#### `track<E extends EventName>(eventName: E, properties?: EventProperties[E])`

Track a type-safe event. TypeScript will enforce correct properties for each event.

```typescript
// Type-safe - properties must match event
track('message_sent', {
  message_length: 150,
  is_guest: false,
  message_count: 5,
});

// TypeScript error - missing required property
track('message_sent', {
  message_length: 150,
  // is_guest and message_count are required
});
```

### Navigation

#### `pageView(path?: string, title?: string)`

Track page views (automatically captures current URL in browser).

```typescript
pageView('/dashboard', 'User Dashboard');
```

### Utilities

#### `flush(): Promise<void>`

Send all pending events to PostHog. Use before application shutdown (server-side).

```typescript
await flush();
```

#### `getAnalyticsClient(config?: AnalyticsClientConfig): AnalyticsClient`

Get the global analytics client instance for advanced usage.

```typescript
const client = getAnalyticsClient();
client.identify('user-123');
```

## Event Types

All tracked events are defined in `AnalyticsEvents` constant:

### Authentication Events

- `USER_SIGNED_UP` - New user registration
- `USER_LOGGED_IN` - User login
- `USER_LOGGED_OUT` - User logout
- `MAGIC_LINK_SENT` - Magic link email sent
- `MAGIC_LINK_VERIFIED` - Magic link verified

### Payment & Subscription Events

- `CHECKOUT_STARTED` - User initiates checkout
- `CHECKOUT_INITIATED` - Checkout session created
- `CHECKOUT_COMPLETED` - Payment successful
- `SUBSCRIPTION_VERIFIED` - Subscription verified
- `PLAN_SELECTED` - User selects pricing plan
- `FREE_ACCESS_CLICKED` - Free trial clicked

### Messaging Events

- `MESSAGE_SENT` - User sends message
- `AI_RESPONSE_RECEIVED` - AI responds to message
- `NEW_CONVERSATION_STARTED` - New conversation created
- `CONVERSATION_LOADED` - Conversation history loaded

### Engagement Events

- `UPGRADE_MODAL_SHOWN` - Upgrade prompt displayed
- `UPGRADE_CLICKED` - User clicks upgrade
- `SETTINGS_OPENED` - Settings page opened
- `FEEDBACK_OPENED` - Feedback form opened
- `FEEDBACK_SUBMITTED` - Feedback submitted

### Onboarding Events

- `GENDER_SELECTED` - Companion gender selected
- `COMPANION_NAME_SET` - AI companion name customized
- `ONBOARDING_COMPLETED` - Onboarding flow completed
- `FUNNEL_DETECTED` - User persona detected

### Funnel Events

- `FUNNEL_ENTRY_VIEWED` - Funnel entry page viewed
- `FUNNEL_PERSONA_SELECTED` - User selects persona
- `FUNNEL_QUESTION_VIEWED` - Question displayed
- `FUNNEL_QUESTION_ANSWERED` - Question answered
- `EMAIL_CAPTURE_VIEWED` - Email capture form shown
- `EMAIL_SUBMITTED` - Email submitted
- `FUNNEL_PROFILE_SENT` - Profile data sent
- `PRICING_VIEWED` - Pricing page viewed
- `SUCCESS_PAGE_LOADED` - Success page loaded
- `PASSWORD_CREATED` - Password created
- `REGISTRATION_COMPLETED` - Registration completed
- `REGISTRATION_FAILED` - Registration failed
- `REDIRECT_TO_APP` - Redirect to main app
- `END_SCREEN_VIEWED` - End screen viewed
- `END_SCREEN_CTA_CLICKED` - CTA button clicked

### Blog Events

- `BLOG_POST_VIEWED` - Blog post viewed
- `BLOG_LIST_VIEWED` - Blog list viewed

### System Events

- `ERROR_OCCURRED` - Error tracked
- `PAGE_VIEW` - Page view (standard PostHog event)

## Property Types

### UserProperties

```typescript
interface UserProperties {
  email?: string;
  displayName?: string;
  isAdmin?: boolean;
  subscriptionStatus?: string;
  plan?: string;
  companionGender?: string;
  onboardingCompleted?: boolean;
  funnelPersona?: string;
  attemptedSubscription?: boolean;
}
```

### Event Properties

Each event has its own property interface. Example:

```typescript
// message_sent requires:
{
  message_length: number;
  is_guest: boolean;
  message_count: number;
}

// checkout_completed requires:
{
  plan: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

// plan_selected requires:
{
  plan: 'monthly' | 'early_believer';
  plan_price?: number;
  plan_billing?: string;
  persona?: string;
  currency?: string;
}
```

## Usage Examples

### React Component Example

```typescript
import { track, identify } from '@anplexa/services/analytics';

export function ChatInterface() {
  const handleSendMessage = async (message: string) => {
    // Track message sent
    track('message_sent', {
      message_length: message.length,
      is_guest: !user,
      message_count: conversationMessages.length + 1,
    });

    // Send to API...
  };

  return (
    <div>
      <input
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage(e.currentTarget.value);
          }
        }}
        placeholder="Type a message..."
      />
    </div>
  );
}
```

### Express Server Example

```typescript
import { track, flush } from '@anplexa/services/analytics';

app.post('/api/auth/register', async (req, res) => {
  const user = await createUser(req.body);

  // Track registration
  track('user_signed_up', {
    email: user.email,
    method: 'email',
  });

  res.json({ user });
});

// Before server shutdown
process.on('SIGTERM', async () => {
  await flush();
  process.exit(0);
});
```

### Funnel Flow Example

```typescript
import { track, identify } from '@anplexa/services/analytics';

function FunnelFlow() {
  const handlePersonaSelect = (persona: string) => {
    track('funnel_persona_selected', {
      persona,
      persona_name: PERSONAS[persona].name,
    });
  };

  const handleQuestionAnswer = (answer: string, questionIndex: number) => {
    track('funnel_question_answered', {
      persona: selectedPersona,
      question_id: `q-${questionIndex}`,
      question_text: questions[questionIndex].text,
      answer,
      answer_index: questions[questionIndex].options.indexOf(answer),
      question_number: questionIndex + 1,
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

  return {
    handlePersonaSelect,
    handleQuestionAnswer,
    handleEmailSubmit,
  };
}
```

## Environment Variables

### Browser

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Server

```bash
POSTHOG_KEY=phc_xxx...
POSTHOG_HOST=https://us.i.posthog.com
```

## Error Handling

The analytics service gracefully handles missing PostHog configuration:

```typescript
// If POSTHOG_KEY is not set:
// - Console warning: "[Analytics] PostHog key not configured..."
// - track() calls are safely ignored
// - No errors are thrown

await initializeAnalytics(); // Warning but no error
track('message_sent', {...}); // Silently ignored
```

## Testing

The service includes comprehensive tests. Run them with:

```bash
npm test --workspace=@anplexa/services
```

Example test:

```typescript
import { track } from '@anplexa/services/analytics';

it('tracks message_sent event', () => {
  expect(() => {
    track('message_sent', {
      message_length: 150,
      is_guest: false,
      message_count: 5,
    });
  }).not.toThrow();
});
```

## Performance Considerations

- Event tracking is non-blocking
- Events are batched and sent in the background
- Use `flush()` before shutdown to ensure final events are sent
- No performance impact if PostHog key not configured

## Security

- No sensitive data (passwords, tokens, API keys) should be tracked
- User IDs are anonymized by default
- PostHog API keys should be environment variables
- Never expose PostHog keys in client-side code (use public keys only)

## Troubleshooting

### Events not appearing in PostHog

1. Check PostHog key is correctly set: `process.env.POSTHOG_KEY`
2. Verify PostHog host is accessible
3. Call `flush()` after tracking (server-side)
4. Check browser console for warnings
5. Ensure user is identified before tracking events

### Type errors on track()

Make sure properties match the event definition:

```typescript
// ❌ Wrong - missing required properties
track('message_sent', { message_length: 100 });

// ✅ Correct
track('message_sent', {
  message_length: 100,
  is_guest: false,
  message_count: 5,
});
```

### PostHog not initialized

Call `initializeAnalytics()` once at application startup before tracking events.

## Contributing

To add new events:

1. Add event name to `AnalyticsEvents` in `events.ts`
2. Add property type to `EventProperties` in `events.ts`
3. Update tests in `client.test.ts`
4. Document in this README

## License

Copyright Anplexa - All rights reserved
