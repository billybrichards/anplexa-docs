/**
 * Repository Interfaces
 *
 * Exports all repository interfaces for the domain layer.
 * These interfaces define the contracts that infrastructure implementations must follow.
 */

// User Repository
export type {
  IUserRepository,
  CreateUserData,
  PaginationOptions as UserPaginationOptions,
} from './user.repository.interface.js';

// Message Repository
export type {
  IMessageRepository,
  CreateMessageData,
  PaginationOptions as MessagePaginationOptions,
} from './message.repository.interface.js';

// Conversation Repository
export type {
  IConversationRepository,
  CreateConversationData,
  PaginationOptions as ConversationPaginationOptions,
} from './conversation.repository.interface.js';

// Session Repository
export type {
  ISessionRepository,
  Session,
  CreateSessionData,
} from './session.repository.interface.js';

// Password Reset Token Repository
export type {
  IPasswordResetTokenRepository,
  PasswordResetToken,
  CreatePasswordResetTokenData,
} from './password-reset-token.repository.interface.js';

// API Usage Repository
export type {
  IApiUsageRepository,
  CreateApiUsageData,
  ApiUsageStats,
  DateRangeQuery,
} from './api-usage.repository.interface.js';

// User Feedback Repository
export type {
  IUserFeedbackRepository,
  CreateUserFeedbackData,
  UserFeedbackStats,
} from './user-feedback.repository.interface.js';

// API Key Repository
export type {
  IApiKeyRepository,
  CreateApiKeyData,
} from './api-key.repository.interface.js';

// Funnel API Key Repository
export type {
  IFunnelApiKeyRepository,
  CreateFunnelApiKeyData,
} from './funnel-api-key.repository.interface.js';

// Companion Persona Repository
export type {
  ICompanionPersonaRepository,
  CreateCompanionPersonaData,
  UpdateCompanionPersonaData,
} from './companion-persona.repository.interface.js';
