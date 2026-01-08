---
sidebar_position: 3
---

# Testing

Testing strategy and guidelines for the Anplexa platform using Vitest and Playwright.

## Testing Stack

| Tool | Purpose | Used In |
|------|---------|---------|
| **Vitest** | Unit and integration tests | All apps |
| **Playwright** | End-to-end (E2E) tests | Companions, Funnel |
| **Supertest** | API endpoint testing | Backend API |
| **React Testing Library** | Component testing | Companions, Funnel |

## Test File Structure

### Backend API (`2-terminal-companion`)

```
api/
├── server/
│   ├── routes/
│   │   ├── auth.ts
│   │   └── __tests__/
│   │       └── auth.test.ts
│   ├── services/
│   │   ├── chat-service.ts
│   │   └── __tests__/
│   │       └── chat-service.test.ts
│   └── middleware/
│       ├── auth-middleware.ts
│       └── __tests__/
│           └── auth-middleware.test.ts
├── tests/
│   ├── integration/
│   │   ├── auth-flow.test.ts
│   │   └── chat-flow.test.ts
│   └── fixtures/
│       ├── users.ts
│       └── conversations.ts
└── vitest.config.ts
```

### Companions App (`v0-ai-companion-prototype`)

```
companions/
├── components/
│   ├── chat-interface.tsx
│   └── __tests__/
│       └── chat-interface.test.tsx
├── lib/
│   ├── auth-context.tsx
│   └── __tests__/
│       └── auth-context.test.tsx
├── app/
│   └── api/
│       └── chat/
│           └── __tests__/
│               └── route.test.ts
├── tests/
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── chat.spec.ts
│   │   └── settings.spec.ts
│   └── fixtures/
│       └── mock-responses.ts
├── vitest.config.ts
└── playwright.config.ts
```

### Funnel App (`Funnel-Forge`)

```
funnel/
├── client/
│   ├── components/
│   │   └── __tests__/
│   │       ├── quiz.test.tsx
│   │       └── checkout.test.tsx
│   └── pages/
│       └── __tests__/
│           └── landing.test.tsx
├── server/
│   ├── routes/
│   │   └── __tests__/
│   │       └── stripe.test.ts
│   └── services/
│       └── __tests__/
│           └── email.test.ts
├── tests/
│   ├── e2e/
│   │   ├── quiz-flow.spec.ts
│   │   └── checkout-flow.spec.ts
│   └── fixtures/
│       └── stripe-events.ts
├── vitest.config.ts
└── playwright.config.ts
```

## Running Tests

### Unit Tests with Vitest

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test server/routes/__tests__/auth.test.ts

# Run tests matching pattern
pnpm test -t "authentication"
```

### E2E Tests with Playwright

```bash
# Install Playwright browsers (first time)
pnpm exec playwright install

# Run all E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e --ui

# Run specific E2E test file
pnpm test:e2e tests/e2e/auth.spec.ts

# Run E2E tests in headed mode (visible browser)
pnpm test:e2e --headed

# Generate test report
pnpm test:e2e --reporter=html
```

### API Tests with Supertest

```bash
# Run API integration tests
pnpm test:api

# Run with verbose output
pnpm test:api --verbose
```

## Configuration Files

### Vitest Configuration

Create `vitest.config.ts` in each application root:

```typescript
// vitest.config.ts (Backend API)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/__tests__/**/*.test.ts', '**/tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'tests', '**/*.d.ts'],
    },
    testTimeout: 10000,
  },
});
```

```typescript
// vitest.config.ts (Next.js Companions App)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'tests/e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

```typescript
// vitest.config.ts (Vite Funnel App)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'client/**/__tests__/**/*.test.{ts,tsx}',
      'server/**/__tests__/**/*.test.ts',
    ],
    exclude: ['node_modules', 'dist', 'tests/e2e'],
  },
  resolve: {
    alias: {
      '@client': path.resolve(__dirname, './client'),
      '@server': path.resolve(__dirname, './server'),
    },
  },
});
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

## Writing Unit Tests

### Testing Express Routes (Backend API)

```typescript
// server/routes/__tests__/auth.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRouter } from '../auth';
import { db } from '../../db';

// Mock database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

describe('Auth Routes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
  });

  describe('POST /auth/register', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'securePassword123',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'invalid-email', password: 'password123' })
        .expect(400);

      expect(response.body.error).toContain('email');
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: '123' })
        .expect(400);

      expect(response.body.error).toContain('password');
    });
  });

  describe('POST /auth/login', () => {
    it('should return tokens for valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'securePassword123' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongPassword' })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });
});
```

### Testing Services

```typescript
// server/services/__tests__/chat-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from '../chat-service';
import { OllamaGateway } from '../../adapters/ollama-gateway';

vi.mock('../../adapters/ollama-gateway');

describe('ChatService', () => {
  let chatService: ChatService;
  let mockOllama: vi.Mocked<OllamaGateway>;

  beforeEach(() => {
    mockOllama = new OllamaGateway() as vi.Mocked<OllamaGateway>;
    chatService = new ChatService(mockOllama);
  });

  describe('generateResponse', () => {
    it('should stream response chunks', async () => {
      const mockStream = (async function* () {
        yield { content: 'Hello' };
        yield { content: ' World' };
      })();

      mockOllama.streamChat.mockResolvedValue(mockStream);

      const chunks: string[] = [];
      for await (const chunk of chatService.generateResponse('Hi', [])) {
        chunks.push(chunk.content);
      }

      expect(chunks).toEqual(['Hello', ' World']);
    });

    it('should apply personality to system prompt', async () => {
      await chatService.generateResponse('Hi', [], { personality: 'playful' });

      expect(mockOllama.streamChat).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('playful'),
        })
      );
    });
  });
});
```

### Testing React Components

```typescript
// components/__tests__/chat-interface.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '../chat-interface';
import { AuthProvider } from '@/lib/auth-context';

// Mock useChat hook
vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

describe('ChatInterface', () => {
  const renderWithAuth = (component: React.ReactNode) => {
    return render(<AuthProvider>{component}</AuthProvider>);
  };

  it('renders message input', () => {
    renderWithAuth(<ChatInterface />);

    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
  });

  it('displays ice-breaker suggestions when no messages', () => {
    renderWithAuth(<ChatInterface />);

    expect(screen.getByText(/suggestions/i)).toBeInTheDocument();
  });

  it('submits message on Enter key', async () => {
    const user = userEvent.setup();
    renderWithAuth(<ChatInterface />);

    const input = screen.getByPlaceholderText(/type a message/i);
    await user.type(input, 'Hello AI{enter}');

    // Verify submit was triggered
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('shows loading state during response', () => {
    vi.mock('@ai-sdk/react', () => ({
      useChat: () => ({
        messages: [{ role: 'user', content: 'Hi' }],
        isLoading: true,
      }),
    }));

    renderWithAuth(<ChatInterface />);

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });
});
```

## Writing E2E Tests

### Authentication Flow

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('guest user can access chat', async ({ page }) => {
    await page.click('text=Continue as Guest');

    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    await expect(page.locator('text=6 messages remaining')).toBeVisible();
  });

  test('user can register new account', async ({ page }) => {
    await page.click('text=Create Account');

    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/chat');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('user can login with existing account', async ({ page }) => {
    await page.click('text=Sign In');

    await page.fill('[name="email"]', 'existing@example.com');
    await page.fill('[name="password"]', 'ExistingPass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/chat');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.click('text=Sign In');

    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
```

### Chat Flow

```typescript
// tests/e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/');
    await page.click('text=Sign In');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/chat');
  });

  test('can send and receive messages', async ({ page }) => {
    const input = page.locator('[data-testid="chat-input"]');

    await input.fill('Hello, how are you?');
    await input.press('Enter');

    // User message appears
    await expect(page.locator('text=Hello, how are you?')).toBeVisible();

    // AI response appears (with loading)
    await expect(page.locator('[data-testid="ai-message"]')).toBeVisible({
      timeout: 30000,
    });
  });

  test('can create new conversation', async ({ page }) => {
    await page.click('[data-testid="new-chat-button"]');

    await expect(page.locator('[data-testid="empty-chat"]')).toBeVisible();
    await expect(page.locator('[data-testid="ice-breakers"]')).toBeVisible();
  });

  test('conversation persists after page reload', async ({ page }) => {
    const input = page.locator('[data-testid="chat-input"]');

    await input.fill('Test persistence message');
    await input.press('Enter');

    await page.reload();

    await expect(page.locator('text=Test persistence message')).toBeVisible();
  });
});
```

### Funnel Quiz Flow

```typescript
// tests/e2e/quiz-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Personality Quiz', () => {
  test('completes full quiz flow', async ({ page }) => {
    await page.goto('/');

    // Start quiz
    await page.click('text=Take the Quiz');

    // Question 1
    await expect(page.locator('text=Question 1')).toBeVisible();
    await page.click('[data-answer="A"]');

    // Question 2
    await expect(page.locator('text=Question 2')).toBeVisible();
    await page.click('[data-answer="B"]');

    // Question 3
    await expect(page.locator('text=Question 3')).toBeVisible();
    await page.click('[data-answer="C"]');

    // Results page
    await expect(page.locator('[data-testid="personality-result"]')).toBeVisible();
    await expect(page.locator('text=Your Personality')).toBeVisible();
  });

  test('can go back to previous questions', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Take the Quiz');

    await page.click('[data-answer="A"]');
    await page.click('[data-testid="back-button"]');

    await expect(page.locator('text=Question 1')).toBeVisible();
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: anplexa_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run API tests
        working-directory: ./api
        run: pnpm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/anplexa_test
          JWT_SECRET: test-secret-key-for-ci

      - name: Run Companions tests
        working-directory: ./companions
        run: pnpm test

      - name: Run Funnel tests
        working-directory: ./funnel
        run: pnpm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./api/coverage/lcov.info,./companions/coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Build applications
        run: pnpm build

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          CI: true

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### Test Scripts in package.json

Add these scripts to each application's `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:ci": "vitest run --coverage && playwright test"
  }
}
```

## Best Practices

### Test Organization

1. **Co-locate tests** - Keep tests near the code they test (`__tests__` folders)
2. **Separate E2E tests** - Place E2E tests in `tests/e2e` at project root
3. **Use fixtures** - Share test data in `tests/fixtures`
4. **Name clearly** - Use descriptive test names that explain the expected behavior

### Test Coverage Goals

| Type | Coverage Target | Priority |
|------|-----------------|----------|
| **Unit Tests** | 80%+ | High |
| **Integration Tests** | 60%+ | Medium |
| **E2E Tests** | Critical paths | High |

### What to Test

**Always test:**
- Authentication flows
- Payment processing
- Data validation
- Error handling
- API endpoints

**Skip testing:**
- Third-party library internals
- Simple getters/setters
- Framework-provided functionality
- Purely visual styling

### Mocking Guidelines

```typescript
// Mock external services
vi.mock('../adapters/stripe-service');
vi.mock('../adapters/resend-service');

// Use real implementations for
// - Business logic
// - Data transformations
// - Validation

// Prefer integration tests for
// - Database operations
// - API routes
```
