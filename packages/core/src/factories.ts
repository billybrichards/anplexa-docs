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

import type { IUserRepository } from './repositories/interfaces/user.repository.interface';
import type { IConversationRepository } from './repositories/interfaces/conversation.repository.interface';
import type { IMessageRepository } from './repositories/interfaces/message.repository.interface';
import type { ISessionRepository } from './repositories/interfaces/session.repository.interface';
import type { IBirthChartRepository } from './repositories/interfaces/birth-chart.repository.interface';
import type { ICompanionPersonaRepository } from './repositories/interfaces/companion-persona.repository.interface';
import type { IAstrologyCalculationService } from './domain/services/IAstrologyCalculationService';
import type { SystemPromptConfig } from './domain/services/SystemPromptBuilder';
import type { IPasswordService } from './domain/services/IPasswordService';
import type { IJWTService } from './domain/services/IJWTService';
import type { IStripeService } from './domain/services/IStripeService';
import type { IChatGateway } from './domain/services/IChatGateway';

import { LoginUser, RegisterUser, RefreshToken } from './use-cases/auth/index';
import {
  SendMessageUseCase,
  GetConversationHistoryUseCase,
} from './use-cases/chat/index';
import { CreateCheckoutUseCase } from './use-cases/subscription/index';
import { CalculateBirthChartUseCase } from './use-cases/astrology/CalculateBirthChartUseCase';

/**
 * DI Container for managing repository and service instances
 * Can be extended to support lazy loading and singleton patterns
 */
export interface DIContainer {
  userRepository: IUserRepository;
  conversationRepository: IConversationRepository;
  messageRepository: IMessageRepository;
  sessionRepository: ISessionRepository;
  birthChartRepository?: IBirthChartRepository;
  companionPersonaRepository?: ICompanionPersonaRepository;
  passwordService: IPasswordService;
  jwtService: IJWTService;
  stripeService?: IStripeService;
  astrologyService?: IAstrologyCalculationService;
  chatGateway?: IChatGateway;
  ollamaGateway?: IChatGateway;
  /** Optional configuration for system prompt building */
  systemPromptConfig?: SystemPromptConfig;
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
 * @param passwordService - Password hashing and verification service
 * @param jwtService - JWT token generation and verification service
 * @returns LoginUser instance ready for use
 *
 * @example
 * ```ts
 * const loginUser = createLoginUserUseCase(userRepo, sessionRepo, passwordService, jwtService);
 * const result = await loginUser.execute({ email: 'user@example.com', password: 'pass' });
 * ```
 */
export function createLoginUserUseCase(
  userRepository: IUserRepository,
  sessionRepository: ISessionRepository,
  passwordService: IPasswordService,
  jwtService: IJWTService
): LoginUser {
  return new LoginUser(userRepository, sessionRepository, passwordService, jwtService);
}

/**
 * Create RegisterUser use case instance
 *
 * @param userRepository - Repository for user data access
 * @param sessionRepository - Repository for session data access
 * @param passwordService - Password hashing and verification service
 * @param jwtService - JWT token generation and verification service
 * @returns RegisterUser instance ready for use
 *
 * @example
 * ```ts
 * const registerUser = createRegisterUserUseCase(userRepo, sessionRepo, passwordService, jwtService);
 * const result = await registerUser.execute({
 *   email: 'newuser@example.com',
 *   password: 'password123'
 * });
 * ```
 */
export function createRegisterUserUseCase(
  userRepository: IUserRepository,
  sessionRepository: ISessionRepository,
  passwordService: IPasswordService,
  jwtService: IJWTService
): RegisterUser {
  return new RegisterUser(userRepository, sessionRepository, passwordService, jwtService);
}

/**
 * Create RefreshToken use case instance
 *
 * @param sessionRepository - Repository for session data access
 * @param userRepository - Repository for user data access
 * @param jwtService - JWT token generation and verification service
 * @returns RefreshToken instance ready for use
 *
 * @example
 * ```ts
 * const refreshToken = createRefreshTokenUseCase(sessionRepo, userRepo, jwtService);
 * const result = await refreshToken.execute({ refreshToken: 'token...' });
 * ```
 */
export function createRefreshTokenUseCase(
  sessionRepository: ISessionRepository,
  userRepository: IUserRepository,
  jwtService: IJWTService
): RefreshToken {
  return new RefreshToken(sessionRepository, userRepository, jwtService);
}

// ============================================================================
// Chat Use Case Factories
// ============================================================================

/**
 * Create SendMessageUseCase instance
 *
 * @param conversationRepository - Repository for conversation data access
 * @param messageRepository - Repository for message data access
 * @param chatGateway - AI service gateway for generating responses
 * @param companionPersonaRepository - Optional repository for companion persona data access
 * @param systemPromptConfig - Optional configuration for system prompt building
 * @returns SendMessageUseCase instance ready for use
 *
 * @example
 * ```ts
 * // Basic usage (without persona)
 * const sendMessage = createSendMessageUseCase(convRepo, msgRepo, chatGateway);
 *
 * // With persona support
 * const sendMessage = createSendMessageUseCase(
 *   convRepo,
 *   msgRepo,
 *   chatGateway,
 *   personaRepo
 * );
 *
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
  chatGateway: IChatGateway,
  companionPersonaRepository?: ICompanionPersonaRepository,
  systemPromptConfig?: SystemPromptConfig
): SendMessageUseCase {
  return new SendMessageUseCase(
    conversationRepository,
    messageRepository,
    chatGateway,
    companionPersonaRepository,
    systemPromptConfig
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
 * @param stripeService - Stripe payment service
 * @returns CreateCheckoutUseCase instance ready for use
 *
 * @example
 * ```ts
 * const createCheckout = createCreateCheckoutUseCase(userRepo, stripeService);
 * const result = await createCheckout.execute({
 *   userId: 'user-123',
 *   priceId: 'price_xxx'
 * });
 * ```
 */
export function createCreateCheckoutUseCase(
  userRepository: IUserRepository,
  stripeService: IStripeService
): CreateCheckoutUseCase {
  return new CreateCheckoutUseCase(userRepository, stripeService);
}

// ============================================================================
// Astrology Use Case Factories
// ============================================================================

/**
 * Create CalculateBirthChartUseCase instance
 *
 * @param birthChartRepository - Repository for birth chart data access
 * @param astrologyService - Service for astrological calculations
 * @returns CalculateBirthChartUseCase instance ready for use
 *
 * @example
 * ```ts
 * const calculateBirthChart = createCalculateBirthChartUseCase(birthChartRepo, astrologyService);
 * const result = await calculateBirthChart.execute({
 *   userId: 'user-123',
 *   birthDate: '1990-01-15',
 *   birthTime: '14:30',
 *   timeZone: 'America/New_York',
 *   latitude: 40.7128,
 *   longitude: -74.0060,
 *   placeName: 'New York',
 *   country: 'USA'
 * });
 * ```
 */
export function createCalculateBirthChartUseCase(
  birthChartRepository: IBirthChartRepository,
  astrologyService: IAstrologyCalculationService
): CalculateBirthChartUseCase {
  return new CalculateBirthChartUseCase(birthChartRepository, astrologyService);
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
  // Build result object with required use cases
  const useCases: {
    loginUser: LoginUser;
    registerUser: RegisterUser;
    refreshToken: RefreshToken;
    sendMessage?: SendMessageUseCase;
    getConversationHistory: GetConversationHistoryUseCase;
    createCheckout?: CreateCheckoutUseCase;
    calculateBirthChart?: CalculateBirthChartUseCase;
  } = {
    // Auth use cases
    loginUser: createLoginUserUseCase(
      container.userRepository,
      container.sessionRepository,
      container.passwordService,
      container.jwtService
    ),
    registerUser: createRegisterUserUseCase(
      container.userRepository,
      container.sessionRepository,
      container.passwordService,
      container.jwtService
    ),
    refreshToken: createRefreshTokenUseCase(
      container.sessionRepository,
      container.userRepository,
      container.jwtService
    ),

    // Chat use cases (sendMessage requires chatGateway)
    getConversationHistory: createGetConversationHistoryUseCase(
      container.conversationRepository,
      container.messageRepository
    ),
  };

  // Add sendMessage use case if chatGateway is provided
  // Persona repository is optional - if not provided, default system prompt is used
  if (container.chatGateway) {
    useCases.sendMessage = createSendMessageUseCase(
      container.conversationRepository,
      container.messageRepository,
      container.chatGateway,
      container.companionPersonaRepository,
      container.systemPromptConfig
    );
  }

  // Add createCheckout use case if stripeService is provided
  if (container.stripeService) {
    useCases.createCheckout = createCreateCheckoutUseCase(
      container.userRepository,
      container.stripeService
    );
  }

  // Add calculateBirthChart use case if dependencies are provided
  if (container.birthChartRepository && container.astrologyService) {
    useCases.calculateBirthChart = createCalculateBirthChartUseCase(
      container.birthChartRepository,
      container.astrologyService
    );
  }

  return useCases;
}

/**
 * Type definitions for all use cases
 * Useful for type inference and documentation
 */
export type AllUseCases = ReturnType<typeof createAllUseCases>;
