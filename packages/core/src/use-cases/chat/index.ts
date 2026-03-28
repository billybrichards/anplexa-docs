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

// Route To Agent Use Case
export {
  RouteToAgentUseCase,
  AgentNotFoundError,
  ConversationNotFoundError as RouteToAgentConversationNotFoundError,
} from './RouteToAgentUseCase.js';

export type {
  RouteToAgentInput,
  RouteToAgentOutput,
} from './RouteToAgentUseCase.js';

// Provision Chat Agent Use Case
export {
  ProvisionChatAgentUseCase,
  CompanionPersonaNotFoundError,
  AgentProvisioningError,
} from './ProvisionChatAgentUseCase.js';

export type {
  ProvisionChatAgentInput,
  ProvisionChatAgentOutput,
} from './ProvisionChatAgentUseCase.js';
