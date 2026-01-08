---
sidebar_position: 2
---

# Backend Improvements

This document outlines the plan to refactor the backend from its current structure to a Clean Architecture pattern, improving maintainability, testability, and scalability.

## Current Architecture Issues

### Problem: Fat Controllers

The current architecture suffers from "fat controllers" - route handlers that contain business logic, data access, and HTTP handling all in one place.

**Current Structure:**
```
src/
├── routes/
│   ├── authRoutes.ts      # 985 lines - auth + business logic + data
│   ├── chatRoutes.ts      # 640 lines - chat + AI + data
│   ├── settingsRoutes.ts  # 200+ lines
│   └── conversationRoutes.ts
├── middleware/
│   └── authMiddleware.ts
├── models/
│   └── User.ts            # Mongoose model only
└── index.ts
```

### Issues Identified

| Issue | Impact | Files Affected |
|-------|--------|----------------|
| No domain layer | Business rules scattered in routes | All routes |
| No use cases | Impossible to unit test logic | authRoutes, chatRoutes |
| Direct DB access | Routes coupled to Mongoose | All routes |
| Mixed concerns | HTTP, business, data in one file | authRoutes (985 LOC) |
| No DTOs | Request/response types inconsistent | All routes |
| Error handling | Inconsistent error responses | All routes |

### authRoutes.ts Analysis (985 lines)

Current responsibilities that should be separated:
- User registration with validation
- Email verification flow
- Password reset flow
- Token generation and refresh
- Session management
- OAuth integration
- Rate limiting logic

### chatRoutes.ts Analysis (640 lines)

Current responsibilities that should be separated:
- Message processing and streaming
- Conversation management
- AI provider integration
- Context window management
- Usage tracking
- Rate limiting

## Target Clean Architecture

### Layered Structure

```
src/
├── domain/                 # Enterprise Business Rules
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Conversation.ts
│   │   ├── Message.ts
│   │   └── Session.ts
│   ├── value-objects/
│   │   ├── Email.ts
│   │   ├── Password.ts
│   │   └── Token.ts
│   ├── errors/
│   │   ├── DomainError.ts
│   │   ├── AuthenticationError.ts
│   │   └── ValidationError.ts
│   └── repositories/       # Interfaces only
│       ├── IUserRepository.ts
│       ├── IConversationRepository.ts
│       └── ISessionRepository.ts
│
├── application/            # Application Business Rules
│   ├── use-cases/
│   │   ├── auth/
│   │   │   ├── LoginUser.ts
│   │   │   ├── RegisterUser.ts
│   │   │   ├── VerifyEmail.ts
│   │   │   ├── ResetPassword.ts
│   │   │   └── RefreshToken.ts
│   │   ├── chat/
│   │   │   ├── SendMessage.ts
│   │   │   ├── StreamResponse.ts
│   │   │   └── GetConversationHistory.ts
│   │   └── conversation/
│   │       ├── CreateConversation.ts
│   │       ├── DeleteConversation.ts
│   │       └── ListConversations.ts
│   ├── dto/
│   │   ├── auth/
│   │   │   ├── LoginRequest.ts
│   │   │   ├── LoginResponse.ts
│   │   │   └── RegisterRequest.ts
│   │   └── chat/
│   │       ├── SendMessageRequest.ts
│   │       └── MessageResponse.ts
│   └── services/           # Application services
│       ├── TokenService.ts
│       └── EmailService.ts
│
├── infrastructure/         # Frameworks & Drivers
│   ├── persistence/
│   │   ├── mongoose/
│   │   │   ├── models/
│   │   │   │   ├── UserModel.ts
│   │   │   │   └── ConversationModel.ts
│   │   │   └── repositories/
│   │   │       ├── MongoUserRepository.ts
│   │   │       └── MongoConversationRepository.ts
│   │   └── redis/
│   │       └── RedisSessionRepository.ts
│   ├── external/
│   │   ├── ai/
│   │   │   ├── OpenAIProvider.ts
│   │   │   └── AnthropicProvider.ts
│   │   └── email/
│   │       └── SendGridEmailService.ts
│   └── config/
│       ├── database.ts
│       └── redis.ts
│
└── presentation/           # Interface Adapters
    ├── http/
    │   ├── routes/
    │   │   ├── authRoutes.ts      # < 100 lines
    │   │   ├── chatRoutes.ts      # < 100 lines
    │   │   └── index.ts
    │   ├── middleware/
    │   │   ├── authMiddleware.ts
    │   │   ├── errorHandler.ts
    │   │   └── rateLimiter.ts
    │   └── controllers/
    │       ├── AuthController.ts
    │       └── ChatController.ts
    └── validators/
        ├── authValidators.ts
        └── chatValidators.ts
```

## Use Case Extraction Examples

### LoginUser Use Case

**Before (in authRoutes.ts):**
```typescript
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation mixed with business logic
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Direct DB access
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Business logic in route
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // More business logic
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_SECRET);

    // Direct session management
    await Session.create({ userId: user._id, refreshToken });

    res.json({ token, refreshToken, user: { id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

**After (Clean Architecture):**

```typescript
// domain/entities/User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    private readonly passwordHash: string,
    public readonly isVerified: boolean,
    public readonly createdAt: Date
  ) {}

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }
}

// domain/repositories/IUserRepository.ts
export interface IUserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

// application/use-cases/auth/LoginUser.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
}

export class LoginUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly tokenService: TokenService
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    const email = new Email(request.email); // Validates email format

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isValid = await user.validatePassword(request.password);
    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);

    await this.sessionRepository.create({
      userId: user.id,
      refreshToken,
      expiresAt: this.tokenService.getRefreshExpiry()
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email.value
      }
    };
  }
}

// presentation/http/controllers/AuthController.ts
export class AuthController {
  constructor(
    private readonly loginUser: LoginUser,
    private readonly registerUser: RegisterUser
  ) {}

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.loginUser.execute(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

// presentation/http/routes/authRoutes.ts
const authController = container.resolve(AuthController);

router.post('/login',
  validateRequest(loginSchema),
  (req, res, next) => authController.login(req, res, next)
);
```

### RegisterUser Use Case

```typescript
// application/use-cases/auth/RegisterUser.ts
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  message: string;
}

export class RegisterUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly tokenService: TokenService
  ) {}

  async execute(request: RegisterRequest): Promise<RegisterResponse> {
    // Create value objects (self-validating)
    const email = new Email(request.email);
    const password = new Password(request.password);

    // Check for existing user
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Create user entity
    const user = User.create({
      email,
      passwordHash: await password.hash(),
      name: request.name,
      isVerified: false
    });

    // Persist
    const savedUser = await this.userRepository.save(user);

    // Send verification email
    const verificationToken = this.tokenService.generateVerificationToken(savedUser);
    await this.emailService.sendVerificationEmail(savedUser.email, verificationToken);

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email.value,
        name: savedUser.name
      },
      message: 'Registration successful. Please verify your email.'
    };
  }
}
```

## Repository Pattern Introduction

### Interface Definition

```typescript
// domain/repositories/IUserRepository.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  findByVerificationToken(token: string): Promise<User | null>;
}

// domain/repositories/IConversationRepository.ts
export interface IConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findByUserId(userId: string, options?: PaginationOptions): Promise<Conversation[]>;
  save(conversation: Conversation): Promise<Conversation>;
  delete(id: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
}
```

### Mongoose Implementation

```typescript
// infrastructure/persistence/mongoose/repositories/MongoUserRepository.ts
export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id);
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.value });
    return doc ? this.toDomain(doc) : null;
  }

  async save(user: User): Promise<User> {
    const doc = await UserModel.findByIdAndUpdate(
      user.id,
      this.toPersistence(user),
      { upsert: true, new: true }
    );
    return this.toDomain(doc);
  }

  private toDomain(doc: UserDocument): User {
    return new User(
      doc._id.toString(),
      new Email(doc.email),
      doc.passwordHash,
      doc.isVerified,
      doc.createdAt
    );
  }

  private toPersistence(user: User): Partial<UserDocument> {
    return {
      email: user.email.value,
      passwordHash: user['passwordHash'],
      isVerified: user.isVerified
    };
  }
}
```

## Migration Plan

### Phase 1: Foundation (Week 1-2)

1. **Set up directory structure**
   ```bash
   mkdir -p src/{domain,application,infrastructure,presentation}
   mkdir -p src/domain/{entities,value-objects,errors,repositories}
   mkdir -p src/application/{use-cases,dto,services}
   mkdir -p src/infrastructure/{persistence,external,config}
   mkdir -p src/presentation/http/{routes,middleware,controllers}
   ```

2. **Create base classes and interfaces**
   - DomainError base class
   - Base repository interface
   - Base use case interface

3. **Set up dependency injection**
   - Install tsyringe or similar DI container
   - Configure container bindings

### Phase 2: Auth Extraction (Week 3-4)

1. **Extract User entity and value objects**
   - Email value object with validation
   - Password value object with hashing
   - Token value object

2. **Create auth use cases**
   - LoginUser
   - RegisterUser
   - VerifyEmail
   - ResetPassword
   - RefreshToken

3. **Implement UserRepository**
   - Interface in domain layer
   - Mongoose implementation in infrastructure

4. **Create AuthController**
   - Thin controller delegating to use cases
   - Request validation with Zod

5. **Refactor authRoutes.ts**
   - Target: < 100 lines
   - Only route definitions and middleware composition

### Phase 3: Chat Extraction (Week 5-6)

1. **Extract Chat entities**
   - Conversation entity
   - Message entity
   - Context value object

2. **Create chat use cases**
   - SendMessage
   - StreamResponse
   - GetConversationHistory

3. **Extract AI provider abstraction**
   - IAIProvider interface
   - OpenAI implementation
   - Anthropic implementation

4. **Implement repositories**
   - ConversationRepository
   - MessageRepository

### Phase 4: Integration & Testing (Week 7-8)

1. **Wire up dependency injection**
   - Configure all bindings
   - Create factory functions for controllers

2. **Add unit tests for use cases**
   - Mock repositories
   - Test business logic in isolation

3. **Add integration tests**
   - Test API endpoints
   - Use test database

4. **Update API documentation**
   - Document new response formats
   - Update error codes

## Dependency Injection Setup

### Container Configuration

```typescript
// infrastructure/container.ts
import { container } from 'tsyringe';

// Repositories
container.registerSingleton<IUserRepository>(
  'IUserRepository',
  MongoUserRepository
);
container.registerSingleton<IConversationRepository>(
  'IConversationRepository',
  MongoConversationRepository
);
container.registerSingleton<ISessionRepository>(
  'ISessionRepository',
  RedisSessionRepository
);

// Services
container.registerSingleton<TokenService>(TokenService);
container.registerSingleton<IEmailService>(
  'IEmailService',
  SendGridEmailService
);

// Use Cases
container.register(LoginUser, {
  useFactory: (c) => new LoginUser(
    c.resolve('IUserRepository'),
    c.resolve('ISessionRepository'),
    c.resolve(TokenService)
  )
});

// Controllers
container.register(AuthController, {
  useFactory: (c) => new AuthController(
    c.resolve(LoginUser),
    c.resolve(RegisterUser)
  )
});
```

## Testing Strategy

### Unit Testing Use Cases

```typescript
// tests/unit/application/use-cases/auth/LoginUser.test.ts
describe('LoginUser', () => {
  let loginUser: LoginUser;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockSessionRepository: jest.Mocked<ISessionRepository>;
  let mockTokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockSessionRepository = createMockSessionRepository();
    mockTokenService = createMockTokenService();

    loginUser = new LoginUser(
      mockUserRepository,
      mockSessionRepository,
      mockTokenService
    );
  });

  it('should return tokens on valid credentials', async () => {
    const user = createTestUser({ email: 'test@example.com' });
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockTokenService.generateAccessToken.mockReturnValue('access-token');
    mockTokenService.generateRefreshToken.mockReturnValue('refresh-token');

    const result = await loginUser.execute({
      email: 'test@example.com',
      password: 'validPassword123'
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(mockSessionRepository.create).toHaveBeenCalled();
  });

  it('should throw on invalid email', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(loginUser.execute({
      email: 'nonexistent@example.com',
      password: 'password'
    })).rejects.toThrow(AuthenticationError);
  });

  it('should throw on invalid password', async () => {
    const user = createTestUser();
    mockUserRepository.findByEmail.mockResolvedValue(user);
    jest.spyOn(user, 'validatePassword').mockResolvedValue(false);

    await expect(loginUser.execute({
      email: 'test@example.com',
      password: 'wrongPassword'
    })).rejects.toThrow(AuthenticationError);
  });
});
```

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| authRoutes.ts lines | 985 | < 100 |
| chatRoutes.ts lines | 640 | < 100 |
| Use case test coverage | 0% | > 90% |
| Cyclomatic complexity | High | < 10 |
| Dependency injection | None | Full |
| Repository abstraction | None | Complete |

## Related Documentation

- [Improvement Roadmap](./roadmap.md)
- [Frontend Improvements](./frontend-improvements.md)
- [Monorepo Migration](./monorepo-migration.md)
