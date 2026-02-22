/**
 * @anplexa/core - Clean Architecture Implementation
 *
 * Anplexa's domain layer, business logic, and data persistence contracts.
 *
 * This package follows Clean Architecture principles with four distinct layers:
 * - Domain: Entities and errors (zero external dependencies)
 * - Application: Use cases orchestrating business logic
 * - Interface Adapters: Repository interfaces defining contracts
 * - Infrastructure: Implementations (external to this package)
 *
 * All exports are fully typed with TypeScript. No `any` types in public API.
 *
 * @example
 * ```typescript
 * // Import domain entities
 * import { User, Conversation } from '@anplexa/core';
 *
 * // Import use cases
 * import { LoginUser, SendMessageUseCase } from '@anplexa/core';
 *
 * // Import repository interfaces
 * import type { IUserRepository } from '@anplexa/core';
 *
 * // Import factories
 * import { createLoginUserUseCase } from '@anplexa/core';
 * ```
 */

// ============================================================================
// Domain Layer Exports
// ============================================================================

// Domain entities
export {
  User,
  Conversation,
  Message,
  Session,
  type MessageRole,
} from './domain/entities/index.js';

// Domain errors
export {
  DomainError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from './domain/errors/index.js';

// Domain service interfaces
export type { IPasswordService, GeneratedApiKey, PasswordStrengthResult } from './domain/services/IPasswordService.js';
export type { IJWTService, TokenPayload, TokenPair } from './domain/services/IJWTService.js';
export type { IStripeService, CheckoutSessionOptions, CheckoutSessionResult, CustomerResult, SubscriptionResult, WebhookEvent } from './domain/services/IStripeService.js';
export type { IChatGateway, ChatMessage, GenerateOptions } from './domain/services/IChatGateway.js';

// ============================================================================
// Repository Layer Exports
// ============================================================================

// Repository interfaces (data persistence contracts)
export * from './repositories/interfaces/index.js';

// Repository implementations (for testing and in-memory usage)
export {
  UserRepository,
  ConversationRepository,
  MessageRepository,
  SessionRepository,
  PasswordResetTokenRepository,
  ApiKeyRepository,
  FunnelApiKeyRepository,
  ApiUsageRepository,
  UserFeedbackRepository,
  BirthChartRepository,
  CompanionPersonaRepository,
  LettaAgentRepository,
  MediaGenerationRepository,
  WorkflowRepository,
  ActivityLogRepository,
} from './repositories/index.js';

// ============================================================================
// Application Layer Exports (Use Cases)
// ============================================================================

// Auth use cases
export * from './use-cases/auth/index.js';

// Chat use cases
export * from './use-cases/chat/index.js';

// Subscription use cases
export * from './use-cases/subscription/index.js';

// ============================================================================
// Dependency Injection & Factory Functions
// ============================================================================

export * from './factories.js';
