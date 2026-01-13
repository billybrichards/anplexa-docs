/**
 * Dependency Injection & Factory Functions
 *
 * Provides factory functions for creating instances of repositories and use cases
 * with proper dependency injection.
 *
 * This module handles the wiring of dependencies into use cases and repositories,
 * enabling clean separation of concerns and testability.
 *
 * Usage Patterns:
 * ```ts
 * // Factory for individual use case
 * import { createLoginUserUseCase } from '@anplexa/core';
 *
 * const loginUser = createLoginUserUseCase(userRepository, sessionRepository);
 * const result = await loginUser.execute({ email: 'user@example.com', password: 'pass' });
 *
 * // Factory for all use cases at once
 * import { createAllUseCases, type DIContainer } from '@anplexa/core';
 *
 * const container: DIContainer = {
 *   userRepository: new DrizzleUserRepository(db),
 *   conversationRepository: new DrizzleConversationRepository(db),
 *   messageRepository: new DrizzleMessageRepository(db),
 *   sessionRepository: new RedisSessionRepository(redis),
 * };
 *
 * const useCases = createAllUseCases(container);
 * ```
 *
 * Architecture:
 * - Factories provide a clean way to inject dependencies without requiring a full DI container
 * - Each factory function is responsible for creating an instance with all dependencies wired
 * - Factories can be used standalone or integrated with DI containers (tsyringe, inversify, etc.)
 * - Repository factories abstract database creation and configuration
 */

import type { IUserRepository } from './repositories/interfaces/user.repository.interface.js';
import type { IConversationRepository } from './repositories/interfaces/conversation.repository.interface.js';
import type { IMessageRepository } from './repositories/interfaces/message.repository.interface.js';
import type { ISessionRepository } from './repositories/interfaces/session.repository.interface.js';

import { LoginUser, RegisterUser, RefreshToken } from './use-cases/auth/index.js';
import {
  SendMessageUseCase,
  GetConversationHistoryUseCase,
} from './use-cases/chat/index.js';
import { CreateCheckoutUseCase } from './use-cases/subscription/index.js';

/**
 * DI Container for managing repository and service instances
 * Can be extended to support lazy loading and singleton patterns
 */
export interface DIContainer {
  userRepository: IUserRepository;
  conversationRepository: IConversationRepository;
  messageRepository: IMessageRepository;
  sessionRepository: ISessionRepository;
}

// ============================================================================
// Repository Factories (For Infrastructure Layer)
// ============================================================================

/**
 * Note: Repository factories are typically implemented in @anplexa/database
 * and @anplexa/services packages. These are provided here for documentation
 * and reference purposes.
 *
 * Example implementation:
 * ```ts
 * import { UserRepository } from '@anplexa/core';
 *
 * export function createUserRepository(db: Database): IUserRepository {
 *   return new UserRepository(db);
 * }
 *
 * export function createConversationRepository(db: Database): IConversationRepository {
 *   return new ConversationRepository(db);
 * }
 *
 * export function createMessageRepository(db: Database): IMessageRepository {
 *   return new MessageRepository(db);
 * }
 *
 * export function createSessionRepository(redis: Redis): ISessionRepository {
 *   return new SessionRepository(redis);
 * }
 * ```
 */

// ============================================================================
// Auth Use Case Factories
// ============================================================================

/**
 * Create LoginUser use case instance
 *
 * @param userRepository - Repository for user data access
 * @param sessionRepository - Repository for session data access
 * @returns LoginUser instance ready for use
 *
 * @example
 * ```ts
 * const loginUser = createLoginUserUseCase(userRepo, sessionRepo);
 * const result = await loginUser.execute({ email: 'user@example.com', password: 'pass' });
 * ```
 */
export function createLoginUserUseCase(
  userRepository: IUserRepository,
  sessionRepository: ISessionRepository
): LoginUser {
  return new LoginUser(userRepository, sessionRepository);
}

/**
 * Create RegisterUser use case instance
 *
 * @param userRepository - Repository for user data access
 * @returns RegisterUser instance ready for use
 *
 * @example
 * ```ts
 * const registerUser = createRegisterUserUseCase(userRepo);
 * const result = await registerUser.execute({
 *   email: 'newuser@example.com',
 *   password: 'password123'
 * });
 * ```
 */
export function createRegisterUserUseCase(
  userRepository: IUserRepository
): RegisterUser {
  return new RegisterUser(userRepository);
}

/**
 * Create RefreshToken use case instance
 *
 * @param sessionRepository - Repository for session data access
 * @param userRepository - Repository for user data access
 * @returns RefreshToken instance ready for use
 *
 * @example
 * ```ts
 * const refreshToken = createRefreshTokenUseCase(sessionRepo, userRepo);
 * const result = await refreshToken.execute({ refreshToken: 'token...' });
 * ```
 */
export function createRefreshTokenUseCase(
  sessionRepository: ISessionRepository,
  userRepository: IUserRepository
): RefreshToken {
  return new RefreshToken(sessionRepository, userRepository);
}

// ============================================================================
// Chat Use Case Factories
// ============================================================================

/**
 * Create SendMessageUseCase instance
 *
 * @param conversationRepository - Repository for conversation data access
 * @param messageRepository - Repository for message data access
 * @param userRepository - Repository for user data access
 * @returns SendMessageUseCase instance ready for use
 *
 * @example
 * ```ts
 * const sendMessage = createSendMessageUseCase(convRepo, msgRepo, userRepo);
 * const result = await sendMessage.execute({
 *   conversationId: 'conv-123',
 *   userId: 'user-123',
 *   content: 'Hello!'
 * });
 * ```
 */
export function createSendMessageUseCase(
  conversationRepository: IConversationRepository,
  messageRepository: IMessageRepository,
  userRepository: IUserRepository
): SendMessageUseCase {
  return new SendMessageUseCase(
    conversationRepository,
    messageRepository,
    userRepository
  );
}

/**
 * Create GetConversationHistoryUseCase instance
 *
 * @param conversationRepository - Repository for conversation data access
 * @param messageRepository - Repository for message data access
 * @returns GetConversationHistoryUseCase instance ready for use
 *
 * @example
 * ```ts
 * const getHistory = createGetConversationHistoryUseCase(convRepo, msgRepo);
 * const result = await getHistory.execute({
 *   conversationId: 'conv-123',
 *   userId: 'user-123',
 *   limit: 50
 * });
 * ```
 */
export function createGetConversationHistoryUseCase(
  conversationRepository: IConversationRepository,
  messageRepository: IMessageRepository
): GetConversationHistoryUseCase {
  return new GetConversationHistoryUseCase(conversationRepository, messageRepository);
}

// ============================================================================
// Subscription Use Case Factories
// ============================================================================

/**
 * Create CreateCheckoutUseCase instance
 *
 * @param userRepository - Repository for user data access
 * @returns CreateCheckoutUseCase instance ready for use
 *
 * @example
 * ```ts
 * const createCheckout = createCreateCheckoutUseCase(userRepo);
 * const result = await createCheckout.execute({
 *   userId: 'user-123',
 *   priceId: 'price_xxx'
 * });
 * ```
 */
export function createCreateCheckoutUseCase(
  userRepository: IUserRepository
): CreateCheckoutUseCase {
  return new CreateCheckoutUseCase(userRepository);
}

// ============================================================================
// Container Factory
// ============================================================================

/**
 * Create all use cases with a single DI container
 *
 * Convenience function for setting up all use cases at once when you have
 * repository implementations available.
 *
 * @param container - Object containing all repository implementations
 * @returns Object with all use case factory functions bound to the container
 *
 * @example
 * ```ts
 * const container: DIContainer = {
 *   userRepository: new DrizzleUserRepository(db),
 *   conversationRepository: new DrizzleConversationRepository(db),
 *   messageRepository: new DrizzleMessageRepository(db),
 *   sessionRepository: new RedisSessionRepository(redis)
 * };
 *
 * const useCases = createAllUseCases(container);
 * const result = await useCases.loginUser.execute({...});
 * ```
 */
export function createAllUseCases(container: DIContainer) {
  return {
    // Auth use cases
    loginUser: createLoginUserUseCase(
      container.userRepository,
      container.sessionRepository
    ),
    registerUser: createRegisterUserUseCase(container.userRepository),
    refreshToken: createRefreshTokenUseCase(
      container.sessionRepository,
      container.userRepository
    ),

    // Chat use cases
    sendMessage: createSendMessageUseCase(
      container.conversationRepository,
      container.messageRepository,
      container.userRepository
    ),
    getConversationHistory: createGetConversationHistoryUseCase(
      container.conversationRepository,
      container.messageRepository
    ),

    // Subscription use cases
    createCheckout: createCreateCheckoutUseCase(container.userRepository),
  };
}

/**
 * Type definitions for all use cases
 * Useful for type inference and documentation
 */
export type AllUseCases = ReturnType<typeof createAllUseCases>;
