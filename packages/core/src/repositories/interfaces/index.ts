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
} from './user.repository.interface';

// Message Repository
export type {
  IMessageRepository,
  CreateMessageData,
  PaginationOptions as MessagePaginationOptions,
} from './message.repository.interface';

// Conversation Repository
export type {
  IConversationRepository,
  CreateConversationData,
  PaginationOptions as ConversationPaginationOptions,
} from './conversation.repository.interface';

// Session Repository
export type {
  ISessionRepository,
  Session,
  CreateSessionData,
} from './session.repository.interface';

// Password Reset Token Repository
export type {
  IPasswordResetTokenRepository,
  PasswordResetToken,
  CreatePasswordResetTokenData,
} from './password-reset-token.repository.interface';

// API Usage Repository
export type {
  IApiUsageRepository,
  CreateApiUsageData,
  ApiUsageStats,
  DateRangeQuery,
} from './api-usage.repository.interface';

// User Feedback Repository
export type {
  IUserFeedbackRepository,
  CreateUserFeedbackData,
  UserFeedbackStats,
} from './user-feedback.repository.interface';

// API Key Repository
export type {
  IApiKeyRepository,
  CreateApiKeyData,
} from './api-key.repository.interface';

// Funnel API Key Repository
export type {
  IFunnelApiKeyRepository,
  CreateFunnelApiKeyData,
} from './funnel-api-key.repository.interface';
