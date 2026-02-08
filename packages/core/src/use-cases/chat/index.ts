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
} from './SendMessageUseCase.js';

export type {
  SendMessageInput,
  SendMessageOutput,
} from './SendMessageUseCase.js';

// Create Conversation Use Case
export {
  CreateConversationUseCase,
  UserNotFoundError,
  InvalidTitleError,
} from './CreateConversationUseCase.js';

export type {
  CreateConversationInput,
  CreateConversationOutput,
} from './CreateConversationUseCase.js';

// Get Conversation History Use Case
export {
  GetConversationHistoryUseCase,
  ConversationNotFoundError as GetHistoryConversationNotFoundError,
  UnauthorizedConversationAccessError as GetHistoryUnauthorizedAccessError,
  InvalidPaginationError,
} from './GetConversationHistoryUseCase.js';

export type {
  GetConversationHistoryInput,
  GetConversationHistoryOutput,
} from './GetConversationHistoryUseCase.js';
