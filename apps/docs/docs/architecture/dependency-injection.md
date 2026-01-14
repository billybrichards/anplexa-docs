---
sidebar_position: 3
---

# Dependency Injection with Awilix

## Overview

The Anplexa API uses **Awilix**, a lightweight dependency injection (DI) container for Node.js, to manage application dependencies. This provides centralized configuration, loose coupling, and testability.

---

## What is Dependency Injection?

Dependency Injection is a design pattern that inverts control of dependency creation:

### Without DI (Tightly Coupled)

```typescript
// Bad: LoginRoute creates its own dependencies
export function loginRoute(req: Request, res: Response) {
  // Creates new instance every request - inefficient
  const db = new Database();
  const userRepo = new UserRepository(db);
  const pwdService = new PasswordService();
  const jwtService = new JWTService();

  const loginUC = new LoginUserUseCase(
    userRepo,
    pwdService,
    jwtService
  );

  // Difficult to test - can't inject mocks
  // Hard to change implementations
}
```

### With DI (Loosely Coupled)

```typescript
// Good: Dependencies injected via container
export function loginRoute(req: Request, res: Response) {
  // Container provides all dependencies
  const { useCases } = req.container.cradle;

  // Use injected dependency
  const result = await useCases.loginUser.execute(input);
}
```

---

## Awilix Setup

### Installation

```bash
pnpm add awilix
pnpm add -D @types/awilix
```

### Basic Container Creation

**File**: `/apps/api/src/container.ts`

```typescript
import { createContainer, InjectionMode, asClass, asFunction } from 'awilix';

export interface AppContainer {
  // Database
  pool: Pool;
  db: ReturnType<typeof drizzle>;

  // Repositories
  userRepository: UserRepository;
  conversationRepository: ConversationRepository;
  messageRepository: MessageRepository;
  sessionRepository: SessionRepository;
  passwordResetTokenRepository: PasswordResetTokenRepository;
  apiKeyRepository: ApiKeyRepository;
  funnelApiKeyRepository: FunnelApiKeyRepository;
  apiUsageRepository: ApiUsageRepository;
  userFeedbackRepository: UserFeedbackRepository;

  // Services
  jwtService: JWTService;
  passwordService: PasswordService;
  ollamaGateway: OllamaGateway;
  emailScheduler: EmailScheduler;

  // Use Cases
  useCases: AllUseCases;
}

export function configureContainer(): ReturnType<
  typeof createContainer<AppContainer>
> {
  const container = createContainer<AppContainer>({
    injectionMode: InjectionMode.CLASSIC,
  });

  return container;
}
```

---

## Registration Methods

### 1. Class Registration (asClass)

For classes that should be instantiated with constructor injection:

```typescript
import { asClass } from 'awilix';

container.register({
  // Single instance per application (default)
  userRepository: asClass(UserRepository).singleton(),

  // New instance per resolution
  passwordService: asClass(PasswordService).transient(),

  // Reuse instance for specific lifetime
  sessionRepository: asClass(SessionRepository).scoped(),
});
```

**Lifecycles**:
- **`singleton()`** - One instance for entire application (recommended for expensive resources)
- **`transient()`** - New instance every time it's requested
- **`scoped()`** - One instance per scope (useful for request-scoped dependencies)

### 2. Function Registration (asFunction)

For factory functions that create dependencies:

```typescript
import { asFunction } from 'awilix';

container.register({
  // Database connection pool
  pool: asFunction(() => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL required');
    }
    return new Pool({ connectionString });
  }).singleton(),

  // Drizzle ORM instance
  db: asFunction(({ pool }) => {
    // Receives 'pool' as dependency from container
    return drizzle(pool, { schema });
  }).singleton(),

  // Service with environment config
  jwtService: asFunction(() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET required');

    return new JWTService({
      secret,
      accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
      refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
    });
  }).singleton(),
});
```

### 3. Value Registration (asValue)

For constants and configuration:

```typescript
import { asValue } from 'awilix';

container.register({
  config: asValue({
    appName: 'Anplexa',
    apiVersion: 'v1',
    environment: process.env.NODE_ENV || 'development',
  }),

  logger: asValue(createLogger()),
});
```

---

## Complete Container Configuration

### Full Example

```typescript
export function configureContainer(): ReturnType<
  typeof createContainer<AppContainer>
> {
  const container = createContainer<AppContainer>({
    injectionMode: InjectionMode.CLASSIC,
  });

  // ========== DATABASE ==========
  container.register({
    pool: asFunction(() => {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required');
      }
      return new Pool({ connectionString });
    }).singleton(),

    db: asFunction(({ pool }) => {
      return drizzle(pool, { schema });
    }).singleton(),
  });

  // ========== REPOSITORIES ==========
  container.register({
    userRepository: asClass(UserRepository).singleton(),
    conversationRepository: asClass(ConversationRepository).singleton(),
    messageRepository: asClass(MessageRepository).singleton(),
    sessionRepository: asClass(SessionRepository).singleton(),
    passwordResetTokenRepository: asClass(
      PasswordResetTokenRepository
    ).singleton(),
    apiKeyRepository: asClass(ApiKeyRepository).singleton(),
    funnelApiKeyRepository: asClass(FunnelApiKeyRepository).singleton(),
    apiUsageRepository: asClass(ApiUsageRepository).singleton(),
    userFeedbackRepository: asClass(UserFeedbackRepository).singleton(),
  });

  // ========== SERVICES ==========
  container.register({
    jwtService: asFunction(() => {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
      }
      return new JWTService({
        secret,
        accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
        refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
      });
    }).singleton(),

    passwordService: asClass(PasswordService).singleton(),

    ollamaGateway: asFunction(() => {
      const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const apiKey = process.env.OLLAMA_API_KEY || '';
      return new OllamaGateway({
        baseUrl,
        apiKey,
        generalModel: process.env.OLLAMA_GENERAL_MODEL || 'llama2',
        longFormModel: process.env.OLLAMA_LONG_FORM_MODEL || 'llama2',
      });
    }).singleton(),
  });

  // ========== USE CASES (Factory) ==========
  container.register({
    useCases: asFunction(({
      userRepository,
      conversationRepository,
      messageRepository,
      sessionRepository,
    }) => {
      return createAllUseCases({
        userRepository,
        conversationRepository,
        messageRepository,
        sessionRepository,
      });
    }).singleton(),
  });

  return container;
}
```

---

## Using the Container in Express

### 1. Middleware to Attach Container

Create middleware that attaches the container to each request:

```typescript
// File: apps/api/src/middleware/container.ts

import express from 'express';
import { Container, AppContainer } from '../container';

/**
 * Extend Express Request type to include container
 */
declare global {
  namespace Express {
    interface Request {
      container: Container;
    }
  }
}

/**
 * Middleware to attach DI container to request
 */
export function containerMiddleware(container: Container) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    req.container = container;
    next();
  };
}
```

### 2. Application Setup

```typescript
// File: apps/api/src/app.ts

import express from 'express';
import { configureContainer } from './container';
import { containerMiddleware } from './middleware/container';

export function createApp() {
  const app = express();
  const container = configureContainer();

  // Middleware
  app.use(express.json());
  app.use(containerMiddleware(container));

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/subscription', subscriptionRouter);

  return app;
}
```

### 3. Using in Route Handlers

```typescript
// File: apps/api/src/routes/auth/login.ts

import express from 'express';

const router = express.Router();

/**
 * POST /api/auth/login
 *
 * Login with email and password
 */
router.post('/login', async (req, res, next) => {
  try {
    const { useCases } = req.container.cradle;

    const result = await useCases.loginUser.execute({
      email: req.body.email,
      password: req.body.password,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
```

---

## Dependency Resolution

### 1. Direct Access (cradle)

Most common way to access dependencies:

```typescript
// Get everything from container
const { userRepository, useCases } = req.container.cradle;

// Or destructure specific dependencies
const cradle = req.container.cradle;
const users = cradle.userRepository;
const loginUC = cradle.useCases.loginUser;
```

### 2. Resolve Method

Manual resolution (less common):

```typescript
// Resolve single dependency
const userRepo = container.resolve<UserRepository>('userRepository');

// Resolve with options
const instance = container.resolve('userRepository', {
  lifetime: 'transient',
});
```

### 3. With Injection in Classes

Awilix automatically injects dependencies in class constructors:

```typescript
export class MyUseCase {
  // Constructor automatically receives dependencies
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService
  ) {}

  async execute() {
    // Use injected dependencies
    const user = await this.userRepository.getById('123');
  }
}

// Register in container
container.register({
  myUseCase: asClass(MyUseCase).singleton(),
});
```

---

## Advanced Features

### 1. Scoped Dependencies (Request Scope)

For dependencies that should have one instance per request:

```typescript
// Create request-scoped container
app.use((req, res, next) => {
  // Create child container for this request
  const scope = container.createScope();
  req.container = scope;
  next();
});

// Register scoped dependencies
container.register({
  requestId: asValue(undefined), // Will be set per scope
  requestLogger: asClass(RequestLogger).scoped(),
});
```

### 2. Conditional Registration

Register different implementations based on environment:

```typescript
export function configureContainer() {
  const container = createContainer<AppContainer>();

  if (process.env.NODE_ENV === 'production') {
    // Production: Use real email service
    container.register({
      emailService: asClass(SendgridEmailService).singleton(),
    });
  } else {
    // Development: Use mock email service
    container.register({
      emailService: asClass(MockEmailService).singleton(),
    });
  }

  return container;
}
```

### 3. Lazy Loading

Load dependencies only when needed:

```typescript
// Register factory that creates repository only on first use
container.register({
  expensiveRepository: asFunction(() => {
    console.log('Initializing expensive repository...');
    return new ExpensiveRepository();
  }).singleton(),
});
```

---

## Testing with Awilix

### 1. Creating Mock Container

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createContainer, asValue } from 'awilix';

describe('LoginUserUseCase', () => {
  let container: InjectionMode;

  beforeEach(() => {
    // Create test container
    container = createContainer();

    // Register mocks
    container.register({
      userRepository: asValue({
        getByEmail: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'test@example.com',
          passwordHash: 'hashed',
        }),
      }),

      passwordService: asValue({
        compare: vi.fn().mockResolvedValue(true),
      }),

      jwtService: asValue({
        sign: vi.fn().mockReturnValue('token'),
      }),

      sessionRepository: asValue({
        create: vi.fn().mockResolvedValue({
          id: 'session-1',
          accessToken: 'access',
          refreshToken: 'refresh',
        }),
      }),
    });
  });

  it('should login user with valid credentials', async () => {
    container.register({
      loginUserUseCase: asClass(LoginUserUseCase).singleton(),
    });

    const useCase = container.resolve('loginUserUseCase');
    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'password',
    });

    expect(result.tokens.accessToken).toBe('token');
  });
});
```

### 2. Partial Container for Component Testing

```typescript
// Test only the component, mock other dependencies
const mockContainer = createContainer();

mockContainer.register({
  userRepository: asValue(mockUserRepository),
  conversationRepository: asValue(mockConversationRepository),
  // Other dependencies...
});

const useCase = new GetConversationHistoryUseCase(
  mockContainer.cradle.conversationRepository,
  mockContainer.cradle.messageRepository
);

const result = await useCase.execute({ userId: 'test' });
expect(result.messages).toHaveLength(0);
```

---

## Container Lifecycle

### 1. Application Startup

```typescript
async function main() {
  const app = createApp(); // Creates container internally

  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  return server;
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

### 2. Graceful Shutdown

```typescript
export class DatabaseService {
  constructor(private pool: Pool) {}

  async close(): Promise<void> {
    await this.pool.end();
    console.log('Database connection closed');
  }
}

// On shutdown
process.on('SIGTERM', async () => {
  const { db } = container.cradle;
  await db.close();
  server.close();
});
```

---

## Best Practices

### 1. Use Singletons for Expensive Resources

```typescript
container.register({
  // Database - one per application
  db: asFunction(() => new Database()).singleton(),

  // Repository - reuse database
  userRepository: asClass(UserRepository).singleton(),

  // Service - lightweight
  emailService: asClass(EmailService).singleton(),
});
```

### 2. Define Clear Interfaces

```typescript
// Interface-based registration enables swapping implementations
interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

// Production
class SendgridEmailService implements IEmailService {
  async send(to, subject, body) { /* ... */ }
}

// Testing
class MockEmailService implements IEmailService {
  async send(to, subject, body) { /* ... */ }
}
```

### 3. Validate Configuration at Startup

```typescript
function validateEnvironment() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'OLLAMA_BASE_URL',
  ];

  for (const env of required) {
    if (!process.env[env]) {
      throw new Error(`Missing required environment variable: ${env}`);
    }
  }
}

// Call before creating container
validateEnvironment();
const container = configureContainer();
```

### 4. Type-Safe Resolution

```typescript
// Always type the container
const container = configureContainer();
const cradle: AppContainer = container.cradle;

// TypeScript ensures you access valid properties
const users = cradle.userRepository; // ✅ Valid
const invalid = cradle.invalidKey; // ❌ TypeScript error
```

### 5. Document Dependencies

```typescript
/**
 * Dependency Injection Container
 *
 * Manages all application dependencies including:
 * - Database connections
 * - Repository implementations (9 repositories)
 * - Business logic services
 * - Use case orchestrators
 *
 * @see ./container.ts for full configuration
 */
export interface AppContainer {
  // ... documented properties
}
```

---

## Common Patterns

### Pattern 1: Service Locator Anti-Pattern

Avoid using the container as a service locator:

```typescript
// ❌ Bad: Service Locator pattern
export function myFunction(container: Container) {
  const repo = container.cradle.userRepository;
  repo.getAll();
}

// ✅ Good: Dependency Injection
export function myFunction(userRepository: IUserRepository) {
  userRepository.getAll();
}
```

### Pattern 2: Lazy Dependencies

Load expensive dependencies only when needed:

```typescript
// Register factory
container.register({
  expensiveService: asFunction(() => {
    console.log('Initializing...');
    return new ExpensiveService();
  }).singleton(),
});

// Accessed only when needed
if (feature.enabled) {
  const service = container.cradle.expensiveService;
}
```

### Pattern 3: Conditional Overrides

Override dependencies in tests:

```typescript
const testContainer = configureContainer();

// Override for specific test
testContainer.register({
  userRepository: asValue(mockUserRepository),
});

// Now all resolved dependencies use mock
const loginUC = testContainer.resolve('loginUserUseCase');
```

---

## Container Type Definition

```typescript
/**
 * Complete container interface defining all registered dependencies
 */
export interface AppContainer {
  // Database Layer
  pool: Pool;
  db: ReturnType<typeof drizzle>;

  // Repository Layer (9 repositories)
  userRepository: UserRepository;
  conversationRepository: ConversationRepository;
  messageRepository: MessageRepository;
  sessionRepository: SessionRepository;
  passwordResetTokenRepository: PasswordResetTokenRepository;
  apiKeyRepository: ApiKeyRepository;
  funnelApiKeyRepository: FunnelApiKeyRepository;
  apiUsageRepository: ApiUsageRepository;
  userFeedbackRepository: UserFeedbackRepository;

  // Service Layer
  jwtService: JWTService;
  passwordService: PasswordService;
  ollamaGateway: OllamaGateway;
  emailScheduler: EmailScheduler;

  // Use Case Layer (12 use cases)
  useCases: AllUseCases;
}
```

---

## Troubleshooting

### Issue: "Module has no exported member"

**Cause**: Dependency not registered in container

**Solution**: Check that all imports are correct and dependency is registered in `configureContainer()`

```typescript
// Verify registration
container.register({
  myService: asClass(MyService).singleton(),
});

// Verify export
export interface AppContainer {
  myService: MyService;
}
```

### Issue: "Cannot find module 'pg'"

**Cause**: Missing dependency

**Solution**: Install required packages

```bash
pnpm add pg drizzle-orm
pnpm add -D @types/pg
```

### Issue: Circular Dependencies

**Cause**: Service A depends on B, B depends on A

**Solution**: Restructure to break cycle

```typescript
// ❌ Circular: A → B → A
class ServiceA {
  constructor(private b: ServiceB) {}
}
class ServiceB {
  constructor(private a: ServiceA) {}
}

// ✅ Refactor: Create base service
class BaseService {}
class ServiceA extends BaseService {}
class ServiceB {
  constructor(private base: BaseService) {}
}
```

---

## Conclusion

Awilix provides a lightweight, type-safe way to manage application dependencies in Node.js. By centralizing dependency configuration, you get:

- **Testability** - Easy to inject mocks in tests
- **Flexibility** - Swap implementations without code changes
- **Maintainability** - Clear dependency graph
- **Scalability** - Easy to add new services and repositories

---

**Document Version**: 1.0
**Last Updated**: January 14, 2026
**Framework**: Awilix v7+
