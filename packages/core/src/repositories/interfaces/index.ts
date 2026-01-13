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
