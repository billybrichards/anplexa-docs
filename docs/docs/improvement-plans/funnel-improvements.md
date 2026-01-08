---
sidebar_position: 4
---

# Funnel Improvements

This document outlines the plan to refactor the marketing funnel application, focusing on route extraction, component splitting, and establishing consistent patterns.

## Current Architecture Issues

### routes.ts Analysis (770 lines)

The `routes.ts` file has become a monolithic routing configuration that handles:

| Responsibility | Lines (approx.) | Issue |
|---------------|-----------------|-------|
| Route definitions | 200 | Should be separate files |
| Form validation logic | 150 | Should use validation library |
| Analytics tracking | 80 | Should be middleware/hook |
| A/B test branching | 100 | Should be separate service |
| Step configuration | 120 | Should be separate config |
| Navigation logic | 120 | Should be in hooks |

### FunnelFlow.tsx Analysis (450 lines)

The `FunnelFlow` component handles too many concerns:

| Concern | Lines (approx.) | Should Be |
|---------|-----------------|-----------|
| Step rendering | 100 | Step components |
| Form state management | 80 | Custom hook |
| Progress tracking | 40 | Separate component |
| Validation | 60 | Validation hook |
| Navigation | 50 | Navigation hook |
| Analytics | 40 | Analytics hook |
| Error handling | 50 | Error boundary |
| Side effects | 30 | Custom hooks |

### Current Structure

```
src/
├── routes.ts              # 770 lines - monolithic
├── components/
│   ├── FunnelFlow.tsx     # 450 lines - too large
│   ├── ProgressBar.tsx
│   └── ui/
├── pages/
│   ├── landing.tsx
│   ├── quiz.tsx
│   └── checkout.tsx
└── types/
    └── funnel.ts
```

## Target Architecture

### Modular Structure

```
src/
├── config/
│   ├── routes.ts              # Route definitions only (< 100 lines)
│   ├── steps.ts               # Step configuration
│   ├── validation.ts          # Validation schemas
│   └── analytics.ts           # Analytics event definitions
│
├── routes/
│   ├── index.tsx              # Route composition
│   ├── landing/
│   │   ├── LandingRoute.tsx
│   │   └── index.ts
│   ├── quiz/
│   │   ├── QuizRoute.tsx
│   │   ├── questions.ts       # Question configuration
│   │   └── index.ts
│   ├── personalization/
│   │   ├── PersonalizationRoute.tsx
│   │   └── index.ts
│   └── checkout/
│       ├── CheckoutRoute.tsx
│       ├── PricingTable.tsx
│       └── index.ts
│
├── components/
│   ├── funnel/
│   │   ├── FunnelFlow.tsx        # < 150 lines - orchestration
│   │   ├── FunnelProgress.tsx    # Progress indicator
│   │   ├── FunnelNavigation.tsx  # Back/Next buttons
│   │   ├── FunnelContainer.tsx   # Layout wrapper
│   │   └── index.ts
│   │
│   ├── steps/
│   │   ├── BaseStep.tsx          # Step wrapper
│   │   ├── WelcomeStep.tsx
│   │   ├── QuizStep.tsx
│   │   ├── PersonalizationStep.tsx
│   │   ├── ResultsStep.tsx
│   │   ├── CheckoutStep.tsx
│   │   └── index.ts
│   │
│   ├── forms/
│   │   ├── QuizForm.tsx
│   │   ├── PersonalizationForm.tsx
│   │   ├── ContactForm.tsx
│   │   └── index.ts
│   │
│   └── ui/
│
├── hooks/
│   ├── useFunnelNavigation.ts
│   ├── useFunnelState.ts
│   ├── useFunnelAnalytics.ts
│   ├── useFunnelValidation.ts
│   ├── useLocalStoragePersist.ts
│   └── index.ts
│
├── services/
│   ├── analytics.ts
│   ├── storage.ts
│   ├── api.ts
│   └── index.ts
│
├── store/
│   ├── funnelStore.ts         # Zustand store
│   └── index.ts
│
└── types/
    ├── funnel.ts
    ├── steps.ts
    └── index.ts
```

## Route Extraction

### Before (routes.ts - 770 lines)

```typescript
// Current: Everything in one file
export const routes = {
  landing: {
    path: '/',
    component: LandingPage,
    meta: { title: 'Welcome' },
    validation: (data) => {
      if (!data.email) return { error: 'Email required' };
      if (!isValidEmail(data.email)) return { error: 'Invalid email' };
      return { valid: true };
    },
    analytics: {
      pageView: 'funnel_landing',
      events: {
        ctaClick: 'landing_cta_click',
        emailSubmit: 'landing_email_submit'
      }
    },
    abTest: {
      variants: ['control', 'variant_a', 'variant_b'],
      getVariant: (userId) => {
        // A/B test logic here
      }
    },
    // ... 100+ more lines per route
  },
  quiz: {
    // ... another 100+ lines
  },
  // ... more routes
};
```

### After (Separated Configuration)

```typescript
// config/routes.ts (< 100 lines)
export const routes = {
  landing: {
    path: '/',
    component: lazy(() => import('@/routes/landing')),
    meta: { title: 'Welcome to Anplexa' }
  },
  quiz: {
    path: '/quiz',
    component: lazy(() => import('@/routes/quiz')),
    meta: { title: 'Find Your Perfect Companion' }
  },
  personalization: {
    path: '/personalization',
    component: lazy(() => import('@/routes/personalization')),
    meta: { title: 'Personalize Your Experience' }
  },
  results: {
    path: '/results',
    component: lazy(() => import('@/routes/results')),
    meta: { title: 'Your Results' }
  },
  checkout: {
    path: '/checkout',
    component: lazy(() => import('@/routes/checkout')),
    meta: { title: 'Complete Your Order' }
  }
} as const;

export type RouteKey = keyof typeof routes;
export type RoutePath = typeof routes[RouteKey]['path'];

// config/steps.ts
export const funnelSteps: FunnelStep[] = [
  {
    id: 'landing',
    route: 'landing',
    order: 0,
    required: true,
    skipCondition: (state) => state.returningUser
  },
  {
    id: 'quiz',
    route: 'quiz',
    order: 1,
    required: true,
    fields: ['quizAnswers']
  },
  {
    id: 'personalization',
    route: 'personalization',
    order: 2,
    required: false,
    skipCondition: (state) => state.skipPersonalization
  },
  {
    id: 'results',
    route: 'results',
    order: 3,
    required: true
  },
  {
    id: 'checkout',
    route: 'checkout',
    order: 4,
    required: true,
    fields: ['email', 'plan']
  }
];

// config/validation.ts
import { z } from 'zod';

export const validationSchemas = {
  landing: z.object({
    email: z.string().email('Please enter a valid email')
  }),

  quiz: z.object({
    quizAnswers: z.array(z.object({
      questionId: z.string(),
      answerId: z.string()
    })).min(1, 'Please answer at least one question')
  }),

  personalization: z.object({
    preferences: z.object({
      communicationStyle: z.enum(['formal', 'casual', 'friendly']),
      responseLength: z.enum(['concise', 'detailed', 'balanced'])
    })
  }),

  checkout: z.object({
    email: z.string().email(),
    plan: z.enum(['free', 'pro', 'enterprise']),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms' })
    })
  })
};

// config/analytics.ts
export const analyticsEvents = {
  landing: {
    pageView: 'funnel_landing_view',
    ctaClick: 'funnel_landing_cta_click',
    emailSubmit: 'funnel_landing_email_submit'
  },
  quiz: {
    pageView: 'funnel_quiz_view',
    answerSelect: 'funnel_quiz_answer',
    complete: 'funnel_quiz_complete'
  },
  checkout: {
    pageView: 'funnel_checkout_view',
    planSelect: 'funnel_checkout_plan_select',
    purchase: 'funnel_checkout_purchase'
  }
};
```

## FunnelFlow Component Split

### Before (FunnelFlow.tsx - 450 lines)

```tsx
// Current: Everything in one component
export function FunnelFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  // ... 20+ more state variables

  // Validation logic (60+ lines)
  const validateStep = (step, data) => {
    // Complex validation logic inline
  };

  // Navigation logic (50+ lines)
  const goToNextStep = () => {
    // Complex navigation logic
  };

  // Analytics logic (40+ lines)
  useEffect(() => {
    // Track page views
  }, [currentStep]);

  // Persistence logic (30+ lines)
  useEffect(() => {
    // Save to localStorage
  }, [formData]);

  // Render logic (200+ lines)
  return (
    <div>
      {currentStep === 0 && <LandingContent {...props} />}
      {currentStep === 1 && <QuizContent {...props} />}
      {/* More inline step rendering */}
    </div>
  );
}
```

### After (Decomposed Components)

```tsx
// components/funnel/FunnelFlow.tsx (< 150 lines)
export function FunnelFlow() {
  const {
    currentStep,
    steps,
    isFirstStep,
    isLastStep
  } = useFunnelNavigation();

  const {
    data,
    updateData,
    isValid,
    errors
  } = useFunnelState();

  useFunnelPersistence(data);
  useFunnelAnalytics(currentStep);

  const CurrentStepComponent = useMemo(() => {
    return stepComponents[currentStep.id] || null;
  }, [currentStep]);

  return (
    <FunnelContainer>
      <FunnelProgress
        currentStep={currentStep.order}
        totalSteps={steps.length}
      />

      <ErrorBoundary fallback={<StepErrorFallback />}>
        <Suspense fallback={<StepSkeleton />}>
          {CurrentStepComponent && (
            <CurrentStepComponent
              data={data}
              errors={errors}
              onUpdate={updateData}
            />
          )}
        </Suspense>
      </ErrorBoundary>

      <FunnelNavigation
        canGoBack={!isFirstStep}
        canGoNext={isValid}
        isLastStep={isLastStep}
      />
    </FunnelContainer>
  );
}

// components/funnel/FunnelProgress.tsx
interface FunnelProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function FunnelProgress({
  currentStep,
  totalSteps,
  labels
}: FunnelProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="funnel-progress">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {labels && (
        <div className="step-labels">
          {labels.map((label, index) => (
            <span
              key={label}
              className={cn(
                'step-label',
                index <= currentStep && 'completed',
                index === currentStep && 'current'
              )}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <span className="step-counter">
        Step {currentStep + 1} of {totalSteps}
      </span>
    </div>
  );
}

// components/funnel/FunnelNavigation.tsx
interface FunnelNavigationProps {
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  isLoading?: boolean;
  onBack?: () => void;
  onNext?: () => void;
}

export function FunnelNavigation({
  canGoBack,
  canGoNext,
  isLastStep,
  isLoading,
  onBack,
  onNext
}: FunnelNavigationProps) {
  const { goBack, goNext } = useFunnelNavigation();

  return (
    <div className="funnel-navigation">
      <Button
        variant="outline"
        onClick={onBack ?? goBack}
        disabled={!canGoBack || isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Button
        onClick={onNext ?? goNext}
        disabled={!canGoNext || isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {isLastStep ? 'Complete' : 'Continue'}
        {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  );
}

// components/steps/QuizStep.tsx
interface QuizStepProps {
  data: FunnelData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<FunnelData>) => void;
}

export function QuizStep({ data, errors, onUpdate }: QuizStepProps) {
  const { trackEvent } = useFunnelAnalytics();
  const questions = useQuizQuestions();

  const handleAnswer = (questionId: string, answerId: string) => {
    const currentAnswers = data.quizAnswers || [];
    const existingIndex = currentAnswers.findIndex(
      a => a.questionId === questionId
    );

    let newAnswers;
    if (existingIndex >= 0) {
      newAnswers = [...currentAnswers];
      newAnswers[existingIndex] = { questionId, answerId };
    } else {
      newAnswers = [...currentAnswers, { questionId, answerId }];
    }

    onUpdate({ quizAnswers: newAnswers });
    trackEvent('quiz_answer', { questionId, answerId });
  };

  return (
    <BaseStep
      title="Find Your Perfect Companion"
      description="Answer a few questions to help us personalize your experience"
    >
      <div className="quiz-questions space-y-6">
        {questions.map((question) => (
          <QuizQuestion
            key={question.id}
            question={question}
            selectedAnswer={
              data.quizAnswers?.find(a => a.questionId === question.id)?.answerId
            }
            onSelect={(answerId) => handleAnswer(question.id, answerId)}
            error={errors[`quiz.${question.id}`]}
          />
        ))}
      </div>
    </BaseStep>
  );
}
```

## State Persistence with localStorage

### useFunnelPersistence Hook

```typescript
// hooks/useLocalStoragePersist.ts
const STORAGE_KEY = 'anplexa_funnel_state';
const EXPIRY_HOURS = 24;

interface PersistedState<T> {
  data: T;
  timestamp: number;
  step: number;
  sessionId: string;
}

export function useLocalStoragePersist<T extends Record<string, unknown>>(
  data: T,
  currentStep: number
) {
  const sessionIdRef = useRef(generateSessionId());

  // Save to localStorage on data/step change
  useEffect(() => {
    const state: PersistedState<T> = {
      data,
      timestamp: Date.now(),
      step: currentStep,
      sessionId: sessionIdRef.current
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to persist funnel state:', error);
    }
  }, [data, currentStep]);

  // Load initial state
  const loadPersistedState = useCallback((): Partial<PersistedState<T>> | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const state: PersistedState<T> = JSON.parse(stored);

      // Check if expired
      const hoursSinceUpdate = (Date.now() - state.timestamp) / (1000 * 60 * 60);
      if (hoursSinceUpdate > EXPIRY_HOURS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return state;
    } catch {
      return null;
    }
  }, []);

  // Clear persisted state
  const clearPersistedState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    loadPersistedState,
    clearPersistedState,
    sessionId: sessionIdRef.current
  };
}

// hooks/useFunnelState.ts
export function useFunnelState() {
  const [data, setData] = useState<FunnelData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { loadPersistedState, clearPersistedState } = useLocalStoragePersist(
    data,
    currentStep
  );

  // Initialize from persisted state
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted?.data) {
      setData(persisted.data);
    }
  }, [loadPersistedState]);

  const updateData = useCallback((updates: Partial<FunnelData>) => {
    setData(prev => ({ ...prev, ...updates }));

    // Clear errors for updated fields
    const updatedFields = Object.keys(updates);
    setErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => delete newErrors[field]);
      return newErrors;
    });
  }, []);

  const validate = useCallback((step: string): boolean => {
    const schema = validationSchemas[step];
    if (!schema) return true;

    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [data]);

  const reset = useCallback(() => {
    setData({});
    setErrors({});
    clearPersistedState();
  }, [clearPersistedState]);

  return {
    data,
    errors,
    updateData,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0
  };
}
```

## API Response Standardization

### Standard Response Format

```typescript
// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Success response
{
  "success": true,
  "data": {
    "userId": "123",
    "subscription": "pro"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Email is required",
      "plan": "Invalid plan selected"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}

// services/api.ts
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new ApiError(
      json.error?.code || 'UNKNOWN_ERROR',
      json.error?.message || 'An error occurred',
      json.error?.details
    );
  }

  return json.data as T;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### Funnel API Service

```typescript
// services/funnelApi.ts
export const funnelApi = {
  async submitStep(stepId: string, data: Partial<FunnelData>): Promise<void> {
    await apiRequest(`/funnel/steps/${stepId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async completeFunnel(data: FunnelData): Promise<CompletionResult> {
    return apiRequest<CompletionResult>('/funnel/complete', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getQuizQuestions(): Promise<QuizQuestion[]> {
    return apiRequest<QuizQuestion[]>('/funnel/quiz/questions');
  },

  async getResults(answers: QuizAnswer[]): Promise<PersonalizationResult> {
    return apiRequest<PersonalizationResult>('/funnel/results', {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  },

  async createCheckoutSession(plan: string): Promise<CheckoutSession> {
    return apiRequest<CheckoutSession>('/funnel/checkout/session', {
      method: 'POST',
      body: JSON.stringify({ plan })
    });
  }
};
```

## Migration Plan

### Phase 1: Configuration Extraction (Week 1)

1. Create `config/` directory
2. Extract route definitions to `config/routes.ts`
3. Extract step configuration to `config/steps.ts`
4. Extract validation schemas to `config/validation.ts`
5. Extract analytics events to `config/analytics.ts`

### Phase 2: Hook Creation (Week 2)

1. Create `useFunnelNavigation` hook
2. Create `useFunnelState` hook
3. Create `useLocalStoragePersist` hook
4. Create `useFunnelAnalytics` hook
5. Create `useFunnelValidation` hook

### Phase 3: Component Decomposition (Week 3)

1. Create `FunnelContainer` wrapper
2. Create `FunnelProgress` component
3. Create `FunnelNavigation` component
4. Create `BaseStep` component
5. Create individual step components

### Phase 4: Route Refactoring (Week 4)

1. Create route directory structure
2. Implement lazy loading for routes
3. Add route-level code splitting
4. Implement route guards

### Phase 5: API Standardization (Week 5)

1. Define standard response types
2. Create API client with error handling
3. Implement funnel API service
4. Add request/response logging

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| routes.ts lines | 770 | < 100 |
| FunnelFlow.tsx lines | 450 | < 150 |
| Number of hooks | 0 | 5+ |
| Code splitting | None | Route-level |
| Test coverage | < 10% | > 70% |
| State persistence | Partial | Complete |

## Related Documentation

- [Improvement Roadmap](./roadmap.md)
- [Frontend Improvements](./frontend-improvements.md)
- [Monorepo Migration](./monorepo-migration.md)
