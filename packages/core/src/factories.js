"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLoginUserUseCase = createLoginUserUseCase;
exports.createRegisterUserUseCase = createRegisterUserUseCase;
exports.createRefreshTokenUseCase = createRefreshTokenUseCase;
exports.createSendMessageUseCase = createSendMessageUseCase;
exports.createGetConversationHistoryUseCase = createGetConversationHistoryUseCase;
exports.createCreateCheckoutUseCase = createCreateCheckoutUseCase;
exports.createAllUseCases = createAllUseCases;
const index_js_1 = require("./use-cases/auth/index.js");
const index_js_2 = require("./use-cases/chat/index.js");
const index_js_3 = require("./use-cases/subscription/index.js");
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
function createLoginUserUseCase(userRepository, sessionRepository) {
    return new index_js_1.LoginUser(userRepository, sessionRepository);
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
function createRegisterUserUseCase(userRepository) {
    return new index_js_1.RegisterUser(userRepository);
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
function createRefreshTokenUseCase(sessionRepository, userRepository) {
    return new index_js_1.RefreshToken(sessionRepository, userRepository);
}
// ============================================================================
// Chat Use Case Factories
// ============================================================================
/**
 * Create SendMessageUseCase instance
 *
 * @param conversationRepository - Repository for conversation data access
 * @param messageRepository - Repository for message data access
 * @param ollamaGateway - AI service gateway for generating responses
 * @returns SendMessageUseCase instance ready for use
 *
 * @example
 * ```ts
 * const sendMessage = createSendMessageUseCase(convRepo, msgRepo, ollamaGateway);
 * const result = await sendMessage.execute({
 *   conversationId: 'conv-123',
 *   userId: 'user-123',
 *   content: 'Hello!'
 * });
 * ```
 */
function createSendMessageUseCase(conversationRepository, messageRepository, ollamaGateway) {
    return new index_js_2.SendMessageUseCase(conversationRepository, messageRepository, ollamaGateway);
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
function createGetConversationHistoryUseCase(conversationRepository, messageRepository) {
    return new index_js_2.GetConversationHistoryUseCase(conversationRepository, messageRepository);
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
function createCreateCheckoutUseCase(userRepository) {
    return new index_js_3.CreateCheckoutUseCase(userRepository);
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
function createAllUseCases(container) {
    // Build result object with required use cases
    const useCases = {
        // Auth use cases
        loginUser: createLoginUserUseCase(container.userRepository, container.sessionRepository),
        registerUser: createRegisterUserUseCase(container.userRepository),
        refreshToken: createRefreshTokenUseCase(container.sessionRepository, container.userRepository),
        // Chat use cases (sendMessage requires ollamaGateway)
        getConversationHistory: createGetConversationHistoryUseCase(container.conversationRepository, container.messageRepository),
        // Subscription use cases
        createCheckout: createCreateCheckoutUseCase(container.userRepository),
    };
    // Add sendMessage use case if ollamaGateway is provided
    if (container.ollamaGateway) {
        useCases.sendMessage = createSendMessageUseCase(container.conversationRepository, container.messageRepository, container.ollamaGateway);
    }
    return useCases;
}
