# Quick Start Guide - @anplexa/core Exports

**For developers integrating @anplexa/core into their projects**

---

## 5-Minute Setup

### 1. Import Domain Models

```typescript
import { User, Conversation, Message, Session } from '@anplexa/core';

// Use in your domain logic
const user = User.create({ id: '123', email: 'user@example.com' });
```

### 2. Import Repository Interfaces

```typescript
import type { IUserRepository, ISessionRepository } from '@anplexa/core';

// Implement these interfaces in your infrastructure layer
class MyUserRepository implements IUserRepository {
  async findById(id: string) { /* ... */ }
  // ... other methods
}
```

### 3. Create DI Container

```typescript
import { createAllUseCases, type DIContainer } from '@anplexa/core';

const container: DIContainer = {
  userRepository: new MyUserRepository(),
  conversationRepository: new MyConversationRepository(),
  messageRepository: new MyMessageRepository(),
  sessionRepository: new MySessionRepository(),
};

// Create all use cases at once
const useCases = createAllUseCases(container);
```

### 4. Use in Controllers

```typescript
export async function loginController(req: Request, res: Response) {
  try {
    const result = await useCases.loginUser.execute({
      email: req.body.email,
      password: req.body.password,
    });
    res.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else if (error instanceof AuthenticationError) {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }
}
```

---

## Common Import Patterns

### Everything from Core

```typescript
import {
  User,
  LoginUser,
  SendMessageUseCase,
  createLoginUserUseCase,
  type IUserRepository,
} from '@anplexa/core';
```

### Just Domain Layer

```typescript
import type { User, Conversation } from '@anplexa/core/domain';
import type { ValidationError } from '@anplexa/core/domain/errors';
```

### Just Repositories

```typescript
import { UserRepository, type IUserRepository } from '@anplexa/core/repositories';
```

### Just Auth Use Cases

```typescript
import {
  LoginUser,
  RegisterUser,
  type LoginUserRequest,
} from '@anplexa/core/use-cases/auth';
```

### Just Factories

```typescript
import {
  createLoginUserUseCase,
  createAllUseCases,
  type DIContainer,
} from '@anplexa/core/factories';
```

---

## Use Case Categories

### Authentication (`/use-cases/auth`)
- `LoginUser` - Authenticate with email/password
- `RegisterUser` - Create new account
- `RefreshToken` - Refresh JWT token
- `ResetPasswordUseCase` - Reset password

### Chat (`/use-cases/chat`)
- `SendMessageUseCase` - Send message in conversation
- `CreateConversationUseCase` - Create new conversation
- `GetConversationHistoryUseCase` - Retrieve messages

### Subscription (`/use-cases/subscription`)
- `CreateCheckoutUseCase` - Create Stripe checkout
- `UpdateSubscriptionUseCase` - Update subscription plan
- `HandleWebhookUseCase` - Handle Stripe webhooks

---

## DI Pattern Comparison

### Pattern 1: Individual Factories (When you need specific use cases)
```typescript
const userRepo = new UserRepository();
const sessionRepo = new SessionRepository();
const loginUser = createLoginUserUseCase(userRepo, sessionRepo);
await loginUser.execute({ email: '...', password: '...' });
```
**Use when**: Only using a few use cases

### Pattern 2: Container Factory (Recommended for most projects)
```typescript
const container: DIContainer = { /* ... */ };
const useCases = createAllUseCases(container);
await useCases.loginUser.execute({ email: '...', password: '...' });
await useCases.sendMessage.execute({ /* ... */ });
```
**Use when**: Using multiple use cases throughout app

### Pattern 3: DI Library Integration (For large apps)
```typescript
import { container } from 'tsyringe';
const appContainer: DIContainer = { /* ... */ };
const useCases = createAllUseCases(appContainer);
// Use with dependency injection framework
```
**Use when**: Using a DI library like tsyringe or inversify

---

## Type Examples

### Use Case Inputs/Outputs
```typescript
import type {
  LoginUserRequest,
  LoginUserResponse,
  SendMessageInput,
  SendMessageOutput,
} from '@anplexa/core';

const loginReq: LoginUserRequest = {
  email: 'user@example.com',
  password: 'pass123',
};

const loginRes: LoginUserResponse = await useCases.loginUser.execute(loginReq);
```

### Domain Models
```typescript
import { User, type MessageRole } from '@anplexa/core';

const user = User.create({
  id: '123',
  email: 'user@example.com',
  passwordHash: '$2b$10$...',
  isVerified: true,
  displayName: 'John Doe',
  credits: 100,
});

if (user.hasSufficientCredits(50)) {
  // Can perform operation
}
```

### Error Handling
```typescript
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from '@anplexa/core';

try {
  await useCases.loginUser.execute(req);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation
  } else if (error instanceof AuthenticationError) {
    // Handle auth failure
  } else if (error instanceof NotFoundError) {
    // Handle not found
  }
}
```

---

## Repository Interface Implementation Example

```typescript
import type { IUserRepository, User } from '@anplexa/core';
import { db } from './database';

export class DrizzleUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await db.select().from(users).where(eq(users.id, id));
    return row[0] ? this.toDomain(row[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await db.select().from(users).where(eq(users.email, email));
    return row[0] ? this.toDomain(row[0]) : null;
  }

  async save(user: User): Promise<User> {
    await db.insert(users).values(this.toPersistence(user));
    return user;
  }

  private toDomain(row: UsersTable): User {
    return User.create({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      isVerified: row.isVerified,
    });
  }

  private toPersistence(user: User) {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      isVerified: user.isVerified,
    };
  }
}
```

---

## Testing with In-Memory Repositories

```typescript
import {
  UserRepository,
  ConversationRepository,
  MessageRepository,
  SessionRepository,
  createAllUseCases,
  type DIContainer,
} from '@anplexa/core';

// Use in-memory repositories for testing
const testContainer: DIContainer = {
  userRepository: new UserRepository(),
  conversationRepository: new ConversationRepository(),
  messageRepository: new MessageRepository(),
  sessionRepository: new SessionRepository(),
};

const useCases = createAllUseCases(testContainer);

describe('LoginUser', () => {
  it('should authenticate valid user', async () => {
    const result = await useCases.loginUser.execute({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.accessToken).toBeDefined();
  });
});
```

---

## File Structure for Integration

```
my-app/
├── src/
│   ├── domain/
│   │   ├── models/      (Your domain models)
│   │   └── errors/      (Your domain errors)
│   ├── repositories/     (Implement @anplexa/core interfaces)
│   │   ├── user.repository.ts
│   │   ├── conversation.repository.ts
│   │   └── ...
│   ├── controllers/      (Use @anplexa/core use cases)
│   │   ├── auth.controller.ts
│   │   ├── chat.controller.ts
│   │   └── ...
│   ├── di.ts             (Setup DIContainer)
│   └── app.ts
└── tests/
    └── use-cases.test.ts  (Test with in-memory repos)
```

---

## DIContainer Setup File Example

```typescript
// src/di.ts
import { createAllUseCases, type DIContainer } from '@anplexa/core';
import { DrizzleUserRepository } from './repositories/user.repository';
import { DrizzleConversationRepository } from './repositories/conversation.repository';
import { DrizzleMessageRepository } from './repositories/message.repository';
import { RedisSessionRepository } from './repositories/session.repository';
import { db } from './database';
import { redis } from './cache';

export const container: DIContainer = {
  userRepository: new DrizzleUserRepository(db),
  conversationRepository: new DrizzleConversationRepository(db),
  messageRepository: new DrizzleMessageRepository(db),
  sessionRepository: new RedisSessionRepository(redis),
};

export const useCases = createAllUseCases(container);
```

Then in your controllers:

```typescript
// src/controllers/auth.controller.ts
import { useCases } from '../di';

export async function login(req: Request, res: Response) {
  try {
    const result = await useCases.loginUser.execute(req.body);
    res.json(result);
  } catch (error) {
    // Error handling
  }
}
```

---

## Troubleshooting

### Q: "Cannot find module '@anplexa/core'"
**A**: Make sure package.json has `@anplexa/core` in dependencies

### Q: "No exported member 'LoginUser'"
**A**: Use correct import path: `from '@anplexa/core/use-cases/auth'` or `from '@anplexa/core'`

### Q: Type errors with DIContainer
**A**: Make sure your repositories implement the interfaces correctly

### Q: "Missing required dependency"
**A**: Check that all 4 repositories are passed to DIContainer

---

## Resources

- Full documentation: See `EXPORTS_SETUP.md`
- Validation report: See `EXPORT_VALIDATION.md`
- Main README: See `README.md`
- Repository interfaces: See `src/repositories/interfaces/`
- Use case examples: See `src/use-cases/*/`

---

## Support

For issues or questions:
1. Check the main `README.md`
2. Review `EXPORTS_SETUP.md` for detailed patterns
3. Look at existing repository implementations
4. Check TypeScript errors - they're usually helpful

---

**Last Updated**: January 13, 2026
**Status**: Production Ready
