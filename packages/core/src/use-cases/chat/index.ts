/**
 * Chat Use Cases
 *
 * Exports all chat-related use cases for clean architecture implementation.
 */

// Send Message Use Case
export {
  SendMessageUseCase,
  ConversationNotFoundError as SendMessageConversationNotFoundError,
  UnauthorizedConversationAccessError as SendMessageUnauthorizedAccessError,
  EmptyMessageError,
  AIServiceError,
} from './SendMessageUseCase';

export type {
  SendMessageInput,
  SendMessageOutput,
} from './SendMessageUseCase';

// Create Conversation Use Case
export {
  CreateConversationUseCase,
  UserNotFoundError,
  InvalidTitleError,
} from './CreateConversationUseCase';

export type {
  CreateConversationInput,
  CreateConversationOutput,
} from './CreateConversationUseCase';

// Get Conversation History Use Case
export {
  GetConversationHistoryUseCase,
  ConversationNotFoundError as GetHistoryConversationNotFoundError,
  UnauthorizedConversationAccessError as GetHistoryUnauthorizedAccessError,
  InvalidPaginationError,
} from './GetConversationHistoryUseCase';

export type {
  GetConversationHistoryInput,
  GetConversationHistoryOutput,
} from './GetConversationHistoryUseCase';
