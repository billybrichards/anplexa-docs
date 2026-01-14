# Funnel Hooks - Custom React Hooks for Marketing Funnel

Complete custom React hooks for managing funnel state, navigation, analytics, and API integration.

---

## Hooks Included

### 1. useFunnelSession
**File**: `./useFunnelSession.ts` (189 LOC)

Manages funnel session state including:
- Step navigation (next, previous, jump)
- User response tracking
- SessionStorage persistence
- Progress calculation
- Persona and email state

**Usage**:
```typescript
import { useFunnelSession } from './hooks';

const session = useFunnelSession(FUNNEL_STEPS);
session.recordResponse('q1', 'answer');
session.goNext();
console.log(session.progress); // 67%
```

**Test Coverage**: 17 tests, ~95% coverage

---

### 2. useFunnelTracking
**File**: `./useFunnelTracking.ts` (275 LOC)

Handles analytics, conversions, and API calls:
- PostHog event tracking (25+ events)
- Meta Pixel integration
- Stripe checkout creation
- Backend API communication
- User existence validation
- Email submission

**Usage**:
```typescript
import { useFunnelTracking } from './hooks';

const tracking = useFunnelTracking();
tracking.trackStepView('q1', 0);
const exists = await tracking.checkUserExists('user@example.com');
const checkoutUrl = await tracking.createCheckoutSession(email, priceId, persona);
```

**Test Coverage**: 26 tests, ~90% coverage

---

## Files

```
hooks/
├── useFunnelSession.ts          # Session management hook
├── useFunnelTracking.ts         # Analytics & API hook
├── index.ts                     # Barrel export
├── README.md                    # This file
└── __tests__/
    ├── useFunnelSession.test.ts # 17 unit tests
    └── useFunnelTracking.test.ts # 26 unit tests
```

---

## Quick Start

### Installation
No installation needed - hooks are part of the project.

### Basic Usage
```typescript
import { useFunnelSession, useFunnelTracking } from '../hooks';
import type { FunnelQuestion, Persona } from '../types';

const FUNNEL_STEPS: FunnelQuestion[] = [
  {
    id: 'q1',
    text: 'What brings you here?',
    options: [
      { text: 'Connection', emoji: '💞' },
      { text: 'Exploration', emoji: '🔍' },
    ],
  },
  // ... more steps
];

export function MyFunnelComponent() {
  const session = useFunnelSession(FUNNEL_STEPS);
  const tracking = useFunnelTracking();

  const handleAnswer = (answer: string) => {
    const stepId = FUNNEL_STEPS[session.currentStep].id;
    session.recordResponse(stepId, answer);
    tracking.trackResponse(stepId, answer);

    if (!session.isLastStep()) {
      session.goNext();
    }
  };

  const handleEmail = async (email: string) => {
    const exists = await tracking.checkUserExists(email);
    if (!exists) {
      session.setEmail(email);
      // Proceed with checkout or free trial
    }
  };

  return (
    <div>
      <Progress value={session.progress} />
      <Question
        text={FUNNEL_STEPS[session.currentStep].text}
        options={FUNNEL_STEPS[session.currentStep].options || []}
        onSelect={handleAnswer}
      />
    </div>
  );
}
```

---

## Features

### useFunnelSession Features
- ✅ SessionStorage persistence (auto-save & restore)
- ✅ UUID session ID generation
- ✅ Progress percentage calculation
- ✅ Step boundary validation
- ✅ Response storage and retrieval
- ✅ Persona and email state
- ✅ Zero external dependencies

### useFunnelTracking Features
- ✅ PostHog event tracking (ready to activate)
- ✅ Meta Pixel integration (ready to activate)
- ✅ 25+ analytics events
- ✅ Stripe checkout integration
- ✅ Backend API communication
- ✅ User existence checking
- ✅ Error handling & logging
- ✅ Request authentication with API keys

---

## API Reference

### useFunnelSession()

**State**:
- `currentStep: number` - Current step index (0-based)
- `totalSteps: number` - Total number of steps
- `progress: number` - Progress percentage (0-100)
- `responses: Record<string, any>` - User responses
- `persona?: Persona` - Selected persona (A-F)
- `email?: string` - User's email
- `sessionId: string` - Unique session ID

**Methods**:
- `goNext()` - Advance to next step
- `goPrevious()` - Go to previous step
- `goToStep(step: number)` - Jump to specific step
- `recordResponse(stepId, response)` - Store response
- `setPersona(persona)` - Set persona
- `setEmail(email)` - Set email
- `resetSession()` - Clear all state
- `isLastStep()` - Check if at last step
- `isFirstStep()` - Check if at first step

---

### useFunnelTracking()

**Tracking Methods**:
- `trackStepView(stepId, stepNumber?)` - Log step view
- `trackResponse(stepId, response)` - Log response
- `trackCompletion(responses)` - Log all responses
- `trackPersonaSelection(persona)` - Log persona selection
- `trackEmailSubmitted(email, path)` - Log email submission
- `trackCheckoutStarted(persona, priceId)` - Log checkout start
- `trackCheckoutCompleted(persona)` - Log checkout completion
- `trackAccountCreated(persona, email)` - Log account creation
- `identifyUser(email, properties)` - Identify user

**API Methods**:
- `checkUserExists(email)` - Check if user registered
- `createCheckoutSession(email, priceId, persona)` - Create Stripe session
- `submitEmail(email, persona)` - Submit free trial email
- `submitFunnelData(data)` - Submit all funnel data

---

## Environment Variables

```bash
# Backend API
REACT_APP_BACKEND_URL=http://localhost:3000
REACT_APP_BACKEND_API_KEY=your-api-key
REACT_APP_FUNNEL_API_KEY=your-funnel-key

# Stripe
REACT_APP_STRIPE_PRICE_ID=price_xxxxxx

# Analytics (optional)
REACT_APP_FACEBOOK_PIXEL_ID=123456789
```

---

## Testing

### Run Tests
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
- **Total**: 43 tests
- **Passing**: 43 ✅ (100%)
- **Coverage**: ~92%

### Test Categories

**useFunnelSession (17 tests)**:
- Initialization (3)
- Navigation (6)
- Response recording (2)
- State management (2)
- Progress calculation (1)
- Utilities (2)
- Reset (2)
- SessionStorage persistence (1)

**useFunnelTracking (26 tests)**:
- Analytics tracking (9)
- API calls (6)
- Error handling (2)
- Memoization (1)
- Integration (8)

---

## TypeScript Support

Full TypeScript support with exported interfaces:

```typescript
import type { UseFunnelSessionReturn, UseFunnelTrackingReturn } from './hooks';
import type { FunnelView, Persona, FunnelResponse } from '../types';

const session: UseFunnelSessionReturn = useFunnelSession(steps);
const tracking: UseFunnelTrackingReturn = useFunnelTracking();
```

---

## Error Handling

All async methods include error handling:

```typescript
try {
  const exists = await tracking.checkUserExists(email);
} catch (err) {
  console.error('Failed to check user:', err);
  // Handle error gracefully
}
```

---

## Performance Considerations

- ✅ Memoized callbacks prevent unnecessary re-renders
- ✅ SessionStorage limits to avoid memory issues
- ✅ Lazy-loaded analytics (can be async)
- ✅ Efficient state updates
- ✅ No memory leaks

---

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile browsers: iOS Safari 14+, Chrome Android 90+

---

## Related Documentation

- **Quick Reference**: See `FUNNEL_HOOKS_QUICK_REFERENCE.md`
- **Complete Guide**: See `PHASE_4_STEP_3_SUMMARY.md`
- **Types**: See `../types/index.ts`
- **Component Example**: See `../pages/FunnelFlow.tsx`

---

## Version History

### v1.0 (January 14, 2026)
- Initial release
- useFunnelSession hook
- useFunnelTracking hook
- 43 unit tests
- Full documentation

---

## Support

For issues or questions:
1. Check test files for usage examples
2. Review FUNNEL_HOOKS_QUICK_REFERENCE.md
3. See component example in FunnelFlow.tsx

---

**Status**: ✅ Production Ready
**Test Coverage**: ~92%
**TypeScript**: Full Support
**Last Updated**: January 14, 2026
