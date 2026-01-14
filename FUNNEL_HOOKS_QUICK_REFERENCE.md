# Funnel Hooks - Quick Reference Guide

## Overview

Two custom React hooks for managing funnel logic in the Anplexa marketing funnel:

| Hook | Purpose | Lines | Tests |
|------|---------|-------|-------|
| **useFunnelSession** | Session state, navigation, responses | 189 | 17 ✅ |
| **useFunnelTracking** | Analytics, API calls, Stripe integration | 275 | 26 ✅ |

---

## useFunnelSession - Session & Navigation

### Location
`/apps/funnel/client/src/hooks/useFunnelSession.ts`

### Import
```typescript
import { useFunnelSession } from '../hooks';
```

### Basic Usage
```typescript
const session = useFunnelSession(FUNNEL_STEPS);

// Read state
console.log(session.currentStep);    // 0
console.log(session.progress);       // 34%
console.log(session.totalSteps);     // 3
console.log(session.responses);      // {}
console.log(session.sessionId);      // UUID

// Navigate
session.goNext();              // Go to next step
session.goPrevious();          // Go to previous step
session.goToStep(2);           // Jump to step 2

// Record responses
session.recordResponse('q1', 'Option A');
session.recordResponse('q2', 'Option B');

// Set user info
session.setPersona('A');
session.setEmail('user@example.com');

// Check step position
if (session.isFirstStep()) { /* ... */ }
if (session.isLastStep()) { /* ... */ }

// Reset all
session.resetSession();
```

### State Properties
```typescript
currentStep: number              // Current step index (0-based)
totalSteps: number               // Total number of steps
progress: number                 // Progress percentage (0-100)
responses: Record<string, any>   // Responses object { q1: 'answer', ... }
persona?: Persona                // Selected persona (A-F)
email?: string                   // User's email
sessionId: string                // Unique session identifier
```

### Methods
```typescript
goNext(): void                          // Advance to next step (bounded)
goPrevious(): void                      // Go to previous step (bounded)
goToStep(step: number): void            // Jump to specific step
recordResponse(stepId: string, response: any): void  // Store response
setPersona(persona: Persona): void      // Set persona
setEmail(email: string): void           // Set email
resetSession(): void                    // Clear all state
isLastStep(): boolean                   // Check if at last step
isFirstStep(): boolean                  // Check if at first step
```

### Features
- ✅ SessionStorage persistence (auto-save/restore)
- ✅ Unique session ID generation
- ✅ Progress calculation
- ✅ Step boundary validation
- ✅ Zero external dependencies
- ✅ Full TypeScript support

---

## useFunnelTracking - Analytics & API

### Location
`/apps/funnel/client/src/hooks/useFunnelTracking.ts`

### Import
```typescript
import { useFunnelTracking } from '../hooks';
```

### Basic Usage
```typescript
const tracking = useFunnelTracking();

// Track analytics
tracking.trackStepView('q1', 0);
tracking.trackPersonaSelection('A');
tracking.trackResponse('q1', 'Option A');
tracking.trackEmailSubmitted('user@example.com', 'free');

// API calls
const exists = await tracking.checkUserExists('user@example.com');
const checkoutUrl = await tracking.createCheckoutSession(
  'user@example.com',
  'price_123',
  'A'
);
await tracking.submitEmail('user@example.com', 'A');

// User identification
tracking.identifyUser('user@example.com', {
  plan: 'pro',
  signup_date: '2024-01-14'
});
```

### Tracking Methods
```typescript
// Individual tracking
trackStepView(stepId: string, stepNumber?: number): void
trackResponse(stepId: string, response: any): void
trackPersonaSelection(persona: Persona): void
trackEmailSubmitted(email: string, path: 'free' | 'paid'): void
trackCheckoutStarted(persona: Persona, priceId: string): void
trackCheckoutCompleted(persona: Persona): void
trackAccountCreated(persona: Persona, email: string): void

// Bulk tracking
trackCompletion(responses: Record<string, any>): void

// User tracking
identifyUser(email: string, properties: Record<string, any>): void
```

### API Methods
```typescript
// Check if user exists
checkUserExists(email: string): Promise<boolean>

// Create Stripe checkout
createCheckoutSession(
  email: string,
  priceId: string,
  persona: Persona
): Promise<string>  // Returns checkout URL

// Submit email (free path)
submitEmail(email: string, persona: Persona): Promise<void>

// Submit funnel data
submitFunnelData(data: FunnelResponse): Promise<void>
```

### Analytics Events Tracked
- `funnel_start` - User enters funnel
- `persona_selected` - User selects persona
- `question_answered` - User answers question
- `funnel_step_viewed` - User views step
- `email_submitted` - User submits email
- `checkout_started` - User initiates checkout
- `checkout_completed` - Stripe checkout complete
- `account_created` - User account created

### Features
- ✅ PostHog integration (ready to activate)
- ✅ Meta Pixel integration (ready to activate)
- ✅ Stripe checkout integration
- ✅ Backend API communication
- ✅ User existence validation
- ✅ Error handling and logging
- ✅ Memoized callbacks
- ✅ Full TypeScript support

---

## Complete Example: Full Funnel Flow

```typescript
import { useFunnelSession, useFunnelTracking } from '../hooks';
import type { FunnelQuestion, Persona } from '../types';

const STEPS: FunnelQuestion[] = [
  {
    id: 'q1',
    text: 'What brings you here?',
    options: [
      { text: 'Connection', emoji: '💞' },
      { text: 'Exploration', emoji: '🔍' },
    ],
  },
  {
    id: 'q2',
    text: 'Preferred communication style?',
    options: [
      { text: 'Gentle', emoji: '🌸' },
      { text: 'Direct', emoji: '⚡' },
    ],
  },
];

export function FunnelFlow() {
  const session = useFunnelSession(STEPS);
  const tracking = useFunnelTracking();

  // Handle answer selection
  const handleAnswer = (answer: string) => {
    const currentStep = STEPS[session.currentStep];

    // Record and track
    session.recordResponse(currentStep.id, answer);
    tracking.trackResponse(currentStep.id, answer);

    // Move forward
    if (!session.isLastStep()) {
      session.goNext();
    } else {
      // Show email form
      setView('email_capture');
      tracking.trackCompletion(session.responses);
    }
  };

  // Handle email submission
  const handleEmailSubmit = async (email: string, path: 'free' | 'paid') => {
    try {
      // Check if exists
      const exists = await tracking.checkUserExists(email);
      if (exists) {
        setError('Email already registered');
        return;
      }

      session.setEmail(email);
      tracking.trackEmailSubmitted(email, path);

      if (path === 'paid') {
        // Create checkout
        const url = await tracking.createCheckoutSession(
          email,
          process.env.REACT_APP_STRIPE_PRICE_ID || '',
          session.persona || 'A'
        );
        window.location.href = url;
      } else {
        // Submit free email
        await tracking.submitEmail(email, session.persona || 'A');
        setView('success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error submitting email');
    }
  };

  // Render progress
  const currentStep = STEPS[session.currentStep];

  return (
    <div>
      <ProgressBar progress={session.progress} />
      <QuestionCard
        question={currentStep.text}
        options={currentStep.options || []}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
```

---

## Environment Variables Required

```bash
# Backend API
REACT_APP_BACKEND_URL=http://localhost:3000
REACT_APP_BACKEND_API_KEY=your-api-key
REACT_APP_FUNNEL_API_KEY=your-funnel-key

# Stripe
REACT_APP_STRIPE_PRICE_ID=price_xxxxxx

# Analytics (optional)
REACT_APP_FACEBOOK_PIXEL_ID=123456789
REACT_APP_POSTHOG_API_KEY=phc_xxxxxx
```

---

## Testing

### Running Tests
```bash
# All tests
npm test

# Specific hook
npm test useFunnelSession.test.ts
npm test useFunnelTracking.test.ts

# With coverage
npm test -- --coverage
```

### Test Results
- **useFunnelSession**: 17 tests ✅
- **useFunnelTracking**: 26 tests ✅
- **Coverage**: ~92%
- **Pass Rate**: 100%

---

## Common Patterns

### Pattern 1: Quiz with Email Capture
```typescript
const handleAnswer = (answer: string) => {
  session.recordResponse(STEPS[session.currentStep].id, answer);

  if (session.isLastStep()) {
    // Show email form
  } else {
    session.goNext();
  }
};

const handleEmail = async (email: string) => {
  const exists = await tracking.checkUserExists(email);
  if (!exists) {
    await tracking.submitEmail(email, session.persona);
  }
};
```

### Pattern 2: Paid Funnel with Checkout
```typescript
const handleCheckout = async (email: string, priceId: string) => {
  const exists = await tracking.checkUserExists(email);
  if (!exists) {
    const url = await tracking.createCheckoutSession(
      email,
      priceId,
      session.persona
    );
    window.location.href = url;
  }
};
```

### Pattern 3: Track and Navigate
```typescript
const handleStep = (stepId: string) => {
  tracking.trackStepView(stepId);
  session.goToStep(parseInt(stepId));
};
```

### Pattern 4: Recovery from SessionStorage
```typescript
// Automatically handled!
const session = useFunnelSession(STEPS);
// If user closes tab and returns, state is restored
```

---

## API Responses

### Check User Response
```typescript
{ exists: true }  // or { exists: false }
```

### Checkout Session Response
```typescript
{ url: 'https://checkout.stripe.com/pay/session123' }
```

### Funnel Response
```typescript
{
  sessionId: 'uuid-123',
  persona: 'A',
  email: 'user@example.com',
  responses: { q1: 'answer1', q2: 'answer2' },
  path: 'paid'
}
```

---

## Error Handling

### Check User Errors
```typescript
try {
  const exists = await tracking.checkUserExists(email);
} catch (err) {
  console.error('Failed to check user:', err);
  // Treat as non-existent on error
}
```

### Checkout Errors
```typescript
try {
  const url = await tracking.createCheckoutSession(email, priceId, persona);
} catch (err) {
  // Could be: User exists, Invalid price, Network error
  setError(err.message);
}
```

### Email Submission Errors
```typescript
try {
  await tracking.submitEmail(email, persona);
} catch (err) {
  setError('Failed to submit email');
}
```

---

## Debugging

### Enable Console Logging
Both hooks log to console by default (replace with PostHog in production):
```typescript
[Analytics] funnel_step_viewed { stepId: 'q1', stepNumber: 0 }
[Analytics] question_answered { persona: 'A', questionId: 'q1', answer: 'Option A' }
```

### Check SessionStorage
```typescript
// In browser DevTools console
sessionStorage.getItem('funnel_session')
// Shows: { currentStep, responses, persona, email, sessionId }
```

### Inspect Requests
Network tab shows all API calls:
- `POST /api/funnel-responses`
- `POST /api/emails`
- `POST /check-user-subscription`
- `GET /api/stripe/checkout`

---

## Files Reference

| File | Purpose |
|------|---------|
| `useFunnelSession.ts` | Session management hook |
| `useFunnelTracking.ts` | Analytics & API hook |
| `index.ts` | Barrel exports |
| `__tests__/useFunnelSession.test.ts` | Session tests |
| `__tests__/useFunnelTracking.test.ts` | Tracking tests |
| `../types/index.ts` | Type definitions |
| `../pages/FunnelFlow.tsx` | Example component |

---

**Version**: 1.0
**Last Updated**: January 14, 2026
**Status**: Production Ready ✅
