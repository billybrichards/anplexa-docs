# @anplexa/core

Core domain layer and application logic for Anplexa, following Clean Architecture principles.

This package contains:
- **Domain Entities**: Core business objects (User, Conversation, Message, Session)
- **Domain Errors**: Business logic exceptions with semantic meaning
- **Repository Interfaces**: Data persistence contracts
- **Use Cases**: Application business logic orchestration
- **Dependency Injection**: Factory functions for instantiating use cases

## Architecture Overview

The core package implements Clean Architecture with four layers:

```
┌─────────────────────────────────────┐
│     Presentation Layer              │ (HTTP routes, controllers)
│  (infrastructure/presentation)      │ DEPENDS ON ↓
├─────────────────────────────────────┤
│     Application Layer               │ (use cases)
│  (use-cases, @anplexa/core)         │ DEPENDS ON ↓
├─────────────────────────────────────┤
│     Domain Layer                    │ (entities, errors, interfaces)
│  (@anplexa/core)                    │ DEPENDS ON ↓
├─────────────────────────────────────┤
│     Infrastructure Layer            │ (repositories, services)
│  (@anplexa/database, @anplexa/services) │ ISOLATED
└─────────────────────────────────────┘
```

**Key Principle**: Dependencies point inward. The domain layer has zero external dependencies.

## Installation

```bash
npm install @anplexa/core
```

## Quick Start

### 1. Import and Use Repositories

```typescript
import { IUserRepository, User } from '@anplexa/core';

// In your infrastructure layer, implement the interface
class DrizzleUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    // Implementation
  }
}
```

### 2. Import and Use Use Cases

```typescript
import { LoginUser, type LoginUserRequest } from '@anplexa/core';

const loginUser = new LoginUser(userRepository, sessionRepository);
const result = await loginUser.execute({
  email: 'user@example.com',
  password: 'password123',
});
```

### 3. Use Factory Functions for Dependency Injection

```typescript
import {
  createLoginUserUseCase,
  createRegisterUserUseCase,
  createSendMessageUseCase,
  createAllUseCases,
  type DIContainer,
} from '@anplexa/core';

// Option 1: Create individual use cases
const loginUser = createLoginUserUseCase(userRepo, sessionRepo);
const registerUser = createRegisterUserUseCase(userRepo);

// Option 2: Create all use cases at once
const container: DIContainer = {
  userRepository,
  conversationRepository,
  messageRepository,
  sessionRepository,
};

const useCases = createAllUseCases(container);
await useCases.loginUser.execute({ email: 'user@example.com', password: 'pass' });
```

## Imports by Category

### Domain Entities

```typescript
import {
  User,
  Conversation,
  Message,
  Session,
  type MessageRole,
} from '@anplexa/core';
```

### Domain Errors

```typescript
import {
  DomainError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from '@anplexa/core';
```

### Repository Interfaces

```typescript
import {
  IUserRepository,
  IConversationRepository,
  IMessageRepository,
  ISessionRepository,
  type CreateUserData,
  type CreateConversationData,
  type CreateMessageData,
  type CreateSessionData,
  type PaginationOptions,
} from '@anplexa/core';
```

### Use Cases - All

```typescript
import { type AllUseCases } from '@anplexa/core';
```

### Use Cases - Auth

```typescript
import {
  LoginUser,
  RegisterUser,
  RefreshToken,
  type LoginUserRequest,
  type LoginUserResponse,
  type RegisterUserRequest,
  type RegisterUserResponse,
  type RefreshTokenRequest,
  type RefreshTokenResponse,
} from '@anplexa/core/use-cases/auth';
```

### Use Cases - Chat

```typescript
import {
  SendMessage,
  GetConversationHistory,
  type SendMessageRequest,
  type SendMessageResponse,
  type GetConversationHistoryRequest,
  type GetConversationHistoryResponse,
} from '@anplexa/core/use-cases/chat';
```

### Use Cases - Subscription

```typescript
import {
  CreateCheckout,
  type CreateCheckoutRequest,
  type CreateCheckoutResponse,
} from '@anplexa/core/use-cases/subscription';
```

### Factory Functions

```typescript
import {
  // Auth factories
  createLoginUserUseCase,
  createRegisterUserUseCase,
  createRefreshTokenUseCase,
  // Chat factories
  createSendMessageUseCase,
  createGetConversationHistoryUseCase,
  // Subscription factories
  createCreateCheckoutUseCase,
  // DI container factory
  createAllUseCases,
  type DIContainer,
  type AllUseCases,
} from '@anplexa/core/factories';
```

## Usage Examples

### Authentication Flow

```typescript
import {
  createLoginUserUseCase,
  createRegisterUserUseCase,
} from '@anplexa/core';

// Setup
const userRepo = new DrizzleUserRepository(db);
const sessionRepo = new RedisSessionRepository(redis);

// Register new user
const registerUser = createRegisterUserUseCase(userRepo);
const newUser = await registerUser.execute({
  email: 'john@example.com',
  password: 'SecurePass123!',
  displayName: 'John Doe',
});

// Login user
const loginUser = createLoginUserUseCase(userRepo, sessionRepo);
const session = await loginUser.execute({
  email: 'john@example.com',
  password: 'SecurePass123!',
});

console.log(session.accessToken); // JWT token
```

### Chat & Conversations

```typescript
import {
  createSendMessageUseCase,
  createGetConversationHistoryUseCase,
} from '@anplexa/core';

const sendMessage = createSendMessageUseCase(
  conversationRepo,
  messageRepo,
  userRepo
);

// Send a message
const result = await sendMessage.execute({
  conversationId: 'conv-123',
  userId: 'user-456',
  content: 'Hello, Anplexa!',
});

// Get conversation history
const getHistory = createGetConversationHistoryUseCase(
  conversationRepo,
  messageRepo
);

const history = await getHistory.execute({
  conversationId: 'conv-123',
  userId: 'user-456',
  limit: 50,
  offset: 0,
});

history.messages.forEach((msg) => {
  console.log(`${msg.role}: ${msg.content}`);
});
```

### Subscription Management

```typescript
import { createCreateCheckoutUseCase } from '@anplexa/core';

const createCheckout = createCreateCheckoutUseCase(userRepo);

const checkout = await createCheckout.execute({
  userId: 'user-123',
  priceId: 'price_xxx',
  successUrl: 'https://app.example.com/success',
  cancelUrl: 'https://app.example.com/cancel',
});

// Redirect user to checkout
window.location.href = checkout.url;
```

### Full DI Setup with Controller

```typescript
import { createAllUseCases, type DIContainer } from '@anplexa/core';
import express from 'express';

// Initialize repositories
const container: DIContainer = {
  userRepository: new DrizzleUserRepository(db),
  conversationRepository: new DrizzleConversationRepository(db),
  messageRepository: new DrizzleMessageRepository(db),
  sessionRepository: new RedisSessionRepository(redis),
};

// Create all use cases
const useCases = createAllUseCases(container);

// Use in controllers
const app = express();

app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await useCases.loginUser.execute(req.body);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/chat/send', async (req, res) => {
  try {
    const result = await useCases.sendMessage.execute({
      ...req.body,
      userId: req.user.id,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## Error Handling

The package provides domain-specific errors with semantic meaning:

```typescript
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DomainError,
} from '@anplexa/core';

try {
  await registerUser.execute({
    email: 'invalid-email',
    password: 'pass',
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(`Validation failed on field: ${error.field}`);
  } else if (error instanceof AuthenticationError) {
    console.log('Authentication failed');
  } else if (error instanceof NotFoundError) {
    console.log('Resource not found');
  } else if (error instanceof DomainError) {
    console.log(`Domain error: ${error.code}`);
  }
}
```

## Entity Models

### User Entity

```typescript
import { User } from '@anplexa/core';

const user = User.create({
  id: '123',
  email: 'user@example.com',
  passwordHash: '$2b$10$...',
  isVerified: true,
  displayName: 'John Doe',
  credits: 100,
});

// Check if user has credits
if (user.hasSufficientCredits(50)) {
  // Allow operation
}

// Validate password (delegates to repository)
const isValid = await user.validatePassword('password123');
```

### Conversation Entity

```typescript
import { Conversation } from '@anplexa/core';

const conversation = Conversation.create({
  id: 'conv-123',
  userId: 'user-456',
  title: 'Project Discussion',
  createdAt: new Date(),
});

// Update title
const updated = conversation.updateTitle('New Title');
```

### Message Entity

```typescript
import { Message, type MessageRole } from '@anplexa/core';

const message = Message.create({
  id: 'msg-123',
  conversationId: 'conv-456',
  role: 'user',
  content: 'Hello, assistant!',
});

if (message.isUserMessage()) {
  // Handle user message
}

console.log(message.getRoleDisplayName()); // "You"
```

### Session Entity

```typescript
import { Session } from '@anplexa/core';

const session = Session.create({
  id: 'sess-123',
  userId: 'user-456',
  refreshToken: 'token...',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
});

// Check session validity
if (session.isValid()) {
  // Session is active and not expired
}

if (session.isExpired()) {
  // Session has expired
}
```

## Testing

All use cases are designed for easy testing through dependency injection:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginUser } from '@anplexa/core';
import type { IUserRepository, ISessionRepository } from '@anplexa/core';

describe('LoginUser use case', () => {
  let loginUser: LoginUser;
  let mockUserRepo: IUserRepository;
  let mockSessionRepo: ISessionRepository;

  beforeEach(() => {
    // Create mock repositories
    mockUserRepo = {
      findByEmail: vi.fn(),
      // ... other methods
    };

    mockSessionRepo = {
      save: vi.fn(),
      // ... other methods
    };

    // Inject mocks into use case
    loginUser = new LoginUser(mockUserRepo, mockSessionRepo);
  });

  it('should return tokens on valid credentials', async () => {
    // Setup mocks
    const user = User.create({
      id: '123',
      email: 'test@example.com',
      passwordHash: '$2b$10$...',
      isVerified: true,
    });

    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(user);

    // Execute
    const result = await loginUser.execute({
      email: 'test@example.com',
      password: 'password123',
    });

    // Assert
    expect(result.accessToken).toBeDefined();
    expect(mockSessionRepo.save).toHaveBeenCalled();
  });
});
```

## TypeScript Support

All exports are fully typed with TypeScript. No `any` types are used in the public API.

```typescript
import type {
  IUserRepository,
  User,
  ValidationError,
  LoginUserRequest,
  LoginUserResponse,
} from '@anplexa/core';

const handler = async (request: LoginUserRequest): Promise<LoginUserResponse> => {
  // Type-safe code
};
```

## File Structure

```
src/
├── domain/                          # Business logic (zero external deps)
│   ├── entities/                    # Core business objects
│   │   ├── User.ts
│   │   ├── Conversation.ts
│   │   ├── Message.ts
│   │   ├── Session.ts
│   │   └── index.ts
│   ├── errors/                      # Domain-specific exceptions
│   │   ├── DomainError.ts
│   │   ├── ValidationError.ts
│   │   ├── AuthenticationError.ts
│   │   ├── AuthorizationError.ts
│   │   ├── NotFoundError.ts
│   │   └── index.ts
│   └── index.ts
├── repositories/                    # Data persistence contracts
│   ├── interfaces/
│   │   ├── user.repository.interface.ts
│   │   ├── conversation.repository.interface.ts
│   │   ├── message.repository.interface.ts
│   │   ├── session.repository.interface.ts
│   │   └── index.ts
│   ├── IUserRepository.ts
│   ├── IConversationRepository.ts
│   ├── IMessageRepository.ts
│   ├── ISessionRepository.ts
│   └── index.ts
├── use-cases/                       # Application business logic
│   ├── auth/
│   │   ├── LoginUser.ts
│   │   ├── RegisterUser.ts
│   │   ├── RefreshToken.ts
│   │   └── index.ts
│   ├── chat/
│   │   ├── SendMessage.ts
│   │   ├── GetConversationHistory.ts
│   │   └── index.ts
│   ├── subscription/
│   │   ├── CreateCheckout.ts
│   │   └── index.ts
│   └── index.ts
├── factories.ts                     # DI factory functions
└── index.ts                         # Main export
```

## Package Exports

The package supports conditional exports for optimal bundling:

```typescript
// Main entry point - all exports
import { User, LoginUser, createLoginUserUseCase } from '@anplexa/core';

// Domain layer only
import { User, ValidationError } from '@anplexa/core/domain';
import { User } from '@anplexa/core/domain/entities';
import { ValidationError } from '@anplexa/core/domain/errors';

// Repositories only
import { IUserRepository } from '@anplexa/core/repositories';

// Use cases by category
import { LoginUser } from '@anplexa/core/use-cases/auth';
import { SendMessage } from '@anplexa/core/use-cases/chat';
import { CreateCheckout } from '@anplexa/core/use-cases/subscription';

// Factories
import { createLoginUserUseCase } from '@anplexa/core/factories';
```

## Integration with Infrastructure

This package is designed to be implemented by infrastructure packages:

- **@anplexa/database**: Implements repository interfaces using Drizzle ORM
- **@anplexa/services**: Provides external service integrations

Example implementation:

```typescript
// In @anplexa/database/src/repositories/user.repository.ts
import type { IUserRepository } from '@anplexa/core';
import { User } from '@anplexa/core';

export class DrizzleUserRepository implements IUserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return row[0] ? this.toDomain(row[0]) : null;
  }

  private toDomain(row: UsersTable): User {
    return User.create({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      isVerified: row.isVerified,
      // ... other fields
    });
  }
}
```

## Module Exports Overview

The package provides multiple entry points for optimal bundling:

```typescript
// Main export - everything
import { User, LoginUser, createLoginUserUseCase } from '@anplexa/core';

// Domain layer only
import type { User, ValidationError } from '@anplexa/core/domain';
import type { User } from '@anplexa/core/domain/entities';
import type { ValidationError } from '@anplexa/core/domain/errors';

// Repository interfaces
import type { IUserRepository } from '@anplexa/core/repositories';
import type { IUserRepository } from '@anplexa/core/repositories/interfaces';

// Use cases by category
import { LoginUser, RegisterUser } from '@anplexa/core/use-cases/auth';
import { SendMessageUseCase } from '@anplexa/core/use-cases/chat';
import { CreateCheckoutUseCase } from '@anplexa/core/use-cases/subscription';

// Factory functions
import {
  createLoginUserUseCase,
  createAllUseCases,
  type DIContainer,
} from '@anplexa/core/factories';
```

## Barrel Export Structure

This package follows monorepo barrel export patterns:

```
src/
├── index.ts                     # Main export (all layers)
├── domain/
│   └── index.ts                # Domain layer (entities + errors)
├── repositories/
│   ├── index.ts                # All exports (interfaces + implementations)
│   └── interfaces/
│       └── index.ts            # Repository interfaces only
├── use-cases/
│   ├── index.ts                # All use cases
│   ├── auth/
│   │   └── index.ts            # Auth use cases
│   ├── chat/
│   │   └── index.ts            # Chat use cases
│   └── subscription/
│       └── index.ts            # Subscription use cases
└── factories.ts                # DI factory functions
```

## Contributing

When adding new use cases or entities:

1. Add domain entities to `src/domain/entities/` with proper class exports
2. Add repository interfaces to `src/repositories/interfaces/` following `IXxxRepository` naming
3. Add use cases to `src/use-cases/{category}/` as classes with `XxxUseCase` naming
4. Create factory functions in `src/factories.ts` following `createXxxUseCase` naming
5. Update barrel exports in all `index.ts` files (domain, repositories, use-cases, category)
6. Add types/interfaces alongside implementations for input/output contracts
7. Add tests in `__tests__/` directories
8. Update this README with examples
9. Verify package.json exports support new subpaths if needed

### Naming Conventions

- **Entities**: `User`, `Conversation`, `Message`, `Session`
- **Repository Interfaces**: `IUserRepository`, `IConversationRepository`
- **Use Cases**: `LoginUser`, `LoginUserUseCase`, `SendMessageUseCase`
- **Factories**: `createLoginUserUseCase`, `createSendMessageUseCase`
- **Errors**: `ValidationError`, `AuthenticationError`, custom error classes
- **Request/Response Types**: `LoginUserRequest`, `LoginUserResponse`

## Related Packages

- [@anplexa/contracts](../contracts) - Shared API type definitions
- [@anplexa/database](../database) - Database layer with Drizzle ORM
- [@anplexa/services](../services) - External service integrations

## License

MIT
