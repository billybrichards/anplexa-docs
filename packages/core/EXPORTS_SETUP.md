# Core Package Exports & DI Setup Documentation

## Phase 2: Export Configuration & Dependency Injection Preparation

**Status**: Complete
**Last Updated**: January 13, 2026

---

## Overview

This document outlines the complete export structure and dependency injection (DI) setup for the `@anplexa/core` package. The configuration follows Clean Architecture principles with proper separation of concerns across domain, application, and interface adapter layers.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Domain Layer                                               │
│  - Entities (User, Conversation, Message, Session)          │
│  - Errors (DomainError, ValidationError, etc.)              │
│  - NO external dependencies                                 │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ (depends on)
┌─────────────────────────────────────────────────────────────┐
│  Interface Adapters                                         │
│  - Repository Interfaces (IUserRepository, etc.)            │
│  - Contracts for data persistence                           │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ (depends on)
┌─────────────────────────────────────────────────────────────┐
│  Application Layer                                          │
│  - Use Cases (LoginUser, SendMessageUseCase, etc.)          │
│  - Business logic orchestration                             │
│  - Request/Response DTOs                                    │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ (depends on)
┌─────────────────────────────────────────────────────────────┐
│  Infrastructure Layer (External to this package)            │
│  - @anplexa/database: Repository implementations            │
│  - @anplexa/services: External service integrations         │
│  - Controllers/Routes                                       │
└─────────────────────────────────────────────────────────────┘
```

## Barrel Export Structure

The package implements a multi-level barrel export pattern for optimal bundling and tree-shaking:

### 1. Main Entry Point: `src/index.ts`

**Export Groups**:
- Domain Layer (entities, errors)
- Repository Interfaces
- Repository Implementations (for testing)
- All Use Cases (by category)
- Factory Functions & DI Types

**Usage**:
```typescript
// Main entry - all exports
import {
  User,
  LoginUser,
  SendMessageUseCase,
  createLoginUserUseCase,
  type IUserRepository,
  type DIContainer,
} from '@anplexa/core';
```

### 2. Domain Layer: `src/domain/index.ts`

**Exports**:
- Domain Entities: `User`, `Conversation`, `Message`, `Session`
- Domain Errors: `DomainError`, `ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`

**Usage**:
```typescript
// Domain only (no use cases/factories)
import type {
  User,
  Conversation,
  ValidationError,
} from '@anplexa/core/domain';

// Or by sublayer
import type { User } from '@anplexa/core/domain/entities';
import type { ValidationError } from '@anplexa/core/domain/errors';
```

### 3. Repository Layer: `src/repositories/index.ts`

**Exports**:
- All repository interfaces (via `/interfaces/index.ts`)
- Repository implementations: `UserRepository`, `ConversationRepository`, `MessageRepository`, `SessionRepository`

**Usage**:
```typescript
// All exports (interfaces + implementations)
import {
  UserRepository,
  type IUserRepository,
} from '@anplexa/core/repositories';

// Interfaces only
import type { IUserRepository } from '@anplexa/core/repositories/interfaces';

// Or from main export
import type { IUserRepository } from '@anplexa/core';
```

### 4. Use Cases: `src/use-cases/index.ts`

**Exports by Category**:

#### Auth Use Cases: `src/use-cases/auth/index.ts`
- `LoginUser`
- `RegisterUser`
- `RefreshToken`
- `ResetPasswordUseCase`
- Associated types: `LoginUserRequest`, `LoginUserResponse`, etc.

#### Chat Use Cases: `src/use-cases/chat/index.ts`
- `SendMessageUseCase`
- `GetConversationHistoryUseCase`
- `CreateConversationUseCase`
- Associated types: `SendMessageInput`, `SendMessageOutput`, etc.

#### Subscription Use Cases: `src/use-cases/subscription/index.ts`
- `CreateCheckoutUseCase`
- `UpdateSubscriptionUseCase`
- `HandleWebhookUseCase`
- Associated types: `CreateCheckoutRequest`, `CreateCheckoutResponse`, etc.

**Usage**:
```typescript
// By category
import {
  LoginUser,
  RegisterUser,
  type LoginUserRequest,
} from '@anplexa/core/use-cases/auth';

import {
  SendMessageUseCase,
  type SendMessageInput,
} from '@anplexa/core/use-cases/chat';

// Or from main export
import { LoginUser, SendMessageUseCase } from '@anplexa/core';
```

### 5. Factories & DI: `src/factories.ts`

**Exports**:
- DI Container Interface: `DIContainer`
- Factory Functions (one per use case):
  - Auth: `createLoginUserUseCase`, `createRegisterUserUseCase`, `createRefreshTokenUseCase`
  - Chat: `createSendMessageUseCase`, `createGetConversationHistoryUseCase`, `createCreateConversationUseCase`
  - Subscription: `createCreateCheckoutUseCase`, `createUpdateSubscriptionUseCase`, `createHandleWebhookUseCase`
  - Container: `createAllUseCases`
- Type Exports: `DIContainer`, `AllUseCases`

**Usage**:
```typescript
import {
  createLoginUserUseCase,
  createAllUseCases,
  type DIContainer,
  type AllUseCases,
} from '@anplexa/core/factories';

// Or from main export
import { createLoginUserUseCase } from '@anplexa/core';
```

## Package.json Exports Configuration

The package defines conditional exports for optimal bundling across different environments:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./domain": {
      "types": "./dist/domain/index.d.ts",
      "default": "./dist/domain/index.js"
    },
    "./domain/entities": {
      "types": "./dist/domain/entities/index.d.ts",
      "default": "./dist/domain/entities/index.js"
    },
    "./domain/errors": {
      "types": "./dist/domain/errors/index.d.ts",
      "default": "./dist/domain/errors/index.js"
    },
    "./repositories": {
      "types": "./dist/repositories/index.d.ts",
      "default": "./dist/repositories/index.js"
    },
    "./repositories/interfaces": {
      "types": "./dist/repositories/interfaces/index.d.ts",
      "default": "./dist/repositories/interfaces/index.js"
    },
    "./use-cases": {
      "types": "./dist/use-cases/index.d.ts",
      "default": "./dist/use-cases/index.js"
    },
    "./use-cases/auth": {
      "types": "./dist/use-cases/auth/index.d.ts",
      "default": "./dist/use-cases/auth/index.js"
    },
    "./use-cases/chat": {
      "types": "./dist/use-cases/chat/index.d.ts",
      "default": "./dist/use-cases/chat/index.js"
    },
    "./use-cases/subscription": {
      "types": "./dist/use-cases/subscription/index.d.ts",
      "default": "./dist/use-cases/subscription/index.js"
    },
    "./factories": {
      "types": "./dist/factories.d.ts",
      "default": "./dist/factories.js"
    }
  }
}
```

## Dependency Injection Patterns

### Pattern 1: Individual Factory Functions

Create specific use cases with only their required dependencies:

```typescript
import {
  createLoginUserUseCase,
  createSendMessageUseCase,
} from '@anplexa/core';

// Create repositories (from @anplexa/database)
const userRepository = new DrizzleUserRepository(db);
const conversationRepository = new DrizzleConversationRepository(db);
const messageRepository = new DrizzleMessageRepository(db);
const sessionRepository = new RedisSessionRepository(redis);

// Create use cases with dependencies
const loginUser = createLoginUserUseCase(userRepository, sessionRepository);
const sendMessage = createSendMessageUseCase(
  conversationRepository,
  messageRepository,
  userRepository
);

// Use directly
const result = await loginUser.execute({
  email: 'user@example.com',
  password: 'pass123',
});
```

**Benefits**:
- Fine-grained control over dependencies
- Only inject what's needed
- Easy to mock for testing
- Minimal startup overhead

### Pattern 2: Container Factory (Recommended)

Create all use cases at once with a DI container:

```typescript
import {
  createAllUseCases,
  type DIContainer,
} from '@anplexa/core';

// Create repositories (from @anplexa/database)
const container: DIContainer = {
  userRepository: new DrizzleUserRepository(db),
  conversationRepository: new DrizzleConversationRepository(db),
  messageRepository: new DrizzleMessageRepository(db),
  sessionRepository: new RedisSessionRepository(redis),
};

// Create all use cases at once
const useCases = createAllUseCases(container);

// Use from the container
const result = await useCases.loginUser.execute({
  email: 'user@example.com',
  password: 'pass123',
});

const messages = await useCases.sendMessage.execute({
  conversationId: 'conv-123',
  userId: 'user-456',
  content: 'Hello!',
});
```

**Benefits**:
- Single initialization point
- Centralized dependency management
- Clean type inference
- Easy to extend

### Pattern 3: DI Container Library Integration

For advanced scenarios with tsyringe or inversify:

```typescript
import { container } from 'tsyringe';
import {
  DIContainer,
  createAllUseCases,
} from '@anplexa/core';

// Register repositories in container
container.register('IUserRepository', {
  useValue: new DrizzleUserRepository(db),
});

container.register('IConversationRepository', {
  useValue: new DrizzleConversationRepository(db),
});

container.register('IMessageRepository', {
  useValue: new DrizzleMessageRepository(db),
});

container.register('ISessionRepository', {
  useValue: new RedisSessionRepository(redis),
});

// Create DI container from registered instances
const appContainer: DIContainer = {
  userRepository: container.resolve('IUserRepository'),
  conversationRepository: container.resolve('IConversationRepository'),
  messageRepository: container.resolve('IMessageRepository'),
  sessionRepository: container.resolve('ISessionRepository'),
};

// Use with @anplexa/core
const useCases = createAllUseCases(appContainer);
```

## Repository Interface Implementations

The package includes in-memory repository implementations for testing and development:

```typescript
import {
  UserRepository,
  ConversationRepository,
  MessageRepository,
  SessionRepository,
  type IUserRepository,
} from '@anplexa/core/repositories';

// Use for testing or in-memory development
const testContainer: DIContainer = {
  userRepository: new UserRepository(),
  conversationRepository: new ConversationRepository(),
  messageRepository: new MessageRepository(),
  sessionRepository: new SessionRepository(),
};

const useCases = createAllUseCases(testContainer);
```

**Note**: For production, use database-backed implementations from `@anplexa/database`.

## File Structure

```
src/
├── index.ts                                    # Main export (all layers)
│   ├─→ domain/index.ts
│   ├─→ repositories/index.ts
│   ├─→ use-cases/index.ts
│   └─→ factories.ts
│
├── domain/                                     # Business logic (no deps)
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Conversation.ts
│   │   ├── Message.ts
│   │   ├── Session.ts
│   │   └── index.ts
│   ├── errors/
│   │   ├── DomainError.ts
│   │   ├── ValidationError.ts
│   │   ├── AuthenticationError.ts
│   │   ├── AuthorizationError.ts
│   │   ├── NotFoundError.ts
│   │   └── index.ts
│   └── index.ts
│
├── repositories/                               # Data persistence contracts
│   ├── interfaces/
│   │   ├── user.repository.interface.ts
│   │   ├── conversation.repository.interface.ts
│   │   ├── message.repository.interface.ts
│   │   ├── session.repository.interface.ts
│   │   └── index.ts
│   ├── user.repository.ts                     # In-memory implementation
│   ├── conversation.repository.ts
│   ├── message.repository.ts
│   ├── session.repository.ts
│   └── index.ts
│
├── use-cases/                                  # Application business logic
│   ├── auth/
│   │   ├── LoginUser.ts
│   │   ├── RegisterUser.ts
│   │   ├── RefreshToken.ts
│   │   ├── ResetPasswordUseCase.ts
│   │   └── index.ts
│   ├── chat/
│   │   ├── SendMessageUseCase.ts
│   │   ├── CreateConversationUseCase.ts
│   │   ├── GetConversationHistoryUseCase.ts
│   │   └── index.ts
│   ├── subscription/
│   │   ├── CreateCheckoutUseCase.ts
│   │   ├── UpdateSubscriptionUseCase.ts
│   │   ├── HandleWebhookUseCase.ts
│   │   └── index.ts
│   └── index.ts
│
└── factories.ts                                # DI factory functions
```

## Naming Conventions

### Use Cases

**Convention**: `<ActionObject>UseCase` or `<Action><Object>`

- `LoginUser` - authenticate user
- `RegisterUser` - create new user account
- `RefreshToken` - refresh JWT token
- `SendMessageUseCase` - send message in conversation
- `CreateConversationUseCase` - create conversation
- `GetConversationHistoryUseCase` - retrieve conversation messages
- `CreateCheckoutUseCase` - create Stripe checkout

### Factory Functions

**Convention**: `create<UseCase>` or `create<UseCase>UseCase`

- `createLoginUserUseCase()`
- `createRegisterUserUseCase()`
- `createSendMessageUseCase()`
- `createCreateCheckoutUseCase()`
- `createAllUseCases()` - special container factory

### Repository Interfaces

**Convention**: `I<Entity>Repository`

- `IUserRepository`
- `IConversationRepository`
- `IMessageRepository`
- `ISessionRepository`

### Request/Response Types

**Convention**: `<UseCase><Request|Response|Input|Output>`

- `LoginUserRequest` / `LoginUserResponse`
- `SendMessageInput` / `SendMessageOutput`
- `CreateCheckoutRequest` / `CreateCheckoutResponse`

## Type Safety

All exports are fully typed with TypeScript. No `any` types exist in the public API.

```typescript
import type {
  User,
  ValidationError,
  IUserRepository,
  LoginUserRequest,
  LoginUserResponse,
  DIContainer,
  AllUseCases,
} from '@anplexa/core';

// Complete type safety
const handler = async (
  req: LoginUserRequest
): Promise<LoginUserResponse> => {
  // Type-safe implementation
};

const useUseCases = (useCases: AllUseCases): void => {
  // useCases has proper types for all use case methods
};
```

## Extension Points

When adding new features:

1. **New Domain Entity**: Add to `src/domain/entities/`, export in `domain/index.ts`
2. **New Repository Interface**: Add to `src/repositories/interfaces/`, export in `repositories/interfaces/index.ts`
3. **New Use Case**: Add to `src/use-cases/{category}/`, export in category index and main use-cases index
4. **New Factory**: Add to `src/factories.ts`, export in main index
5. **Update package.json**: Add subpath export if creating new top-level category

## Verification Checklist

- [x] Main index exports domain layer
- [x] Main index exports repository interfaces
- [x] Main index exports repository implementations
- [x] Main index exports all use cases
- [x] Main index exports factory functions
- [x] Domain index exports all entities
- [x] Domain index exports all errors
- [x] Repository index exports interfaces and implementations
- [x] Use-cases index exports all category indices
- [x] Auth index exports all auth use cases
- [x] Chat index exports all chat use cases
- [x] Subscription index exports all subscription use cases
- [x] Factories exports DIContainer interface
- [x] Factories exports all factory functions
- [x] Factories exports AllUseCases type
- [x] package.json has all required exports paths
- [x] TypeScript configuration correct (ESM, strict mode)
- [x] All file extensions use `.js` in imports

## Related Documentation

- See `README.md` for usage examples and patterns
- See `IMPLEMENTATION_SUMMARY.md` for Phase 2 implementation details
- See individual use case files for JSDoc documentation
- See repository interface files for method documentation

## Future Considerations

1. **Lazy Loading**: Implement lazy factory functions for large apps
2. **Validation**: Add request validation middleware
3. **Error Handling**: Centralized error handling strategy
4. **Logging**: Add structured logging to use cases
5. **Metrics**: Track use case execution metrics
6. **Caching**: Add caching layer for read operations

---

**Setup Date**: January 13, 2026
**Status**: Ready for Integration Testing
**Next Phase**: Infrastructure Layer Implementation (@anplexa/database repository implementations)
