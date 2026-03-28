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

// Letta Agent Repository
export type {
  ILettaAgentRepository,
  LettaAgentRecord,
  CreateLettaAgentData,
} from './letta-agent.repository.interface.js';

// Media Generation Repository
export type {
  IMediaGenerationRepository,
  MediaGenerationRecord,
  CreateMediaGenerationData,
  UpdateMediaGenerationData,
} from './media-generation.repository.interface.js';

// Workflow Repository
export type {
  IWorkflowRepository,
  WorkflowRecord,
  CreateWorkflowData,
} from './workflow.repository.interface.js';

// Activity Log Repository
export type {
  IActivityLogRepository,
  CreateActivityLogData,
  ActivityLogQuery,
} from './activity-log.repository.interface.js';

// Companion Voice Repository
export type {
  ICompanionVoiceRepository,
  CompanionVoiceRecord,
  CreateCompanionVoiceData,
} from './companion-voice.repository.interface.js';

// Voice Call Metadata Repository
export type {
  IVoiceCallMetadataRepository,
  VoiceCallMetadataRecord,
  CreateVoiceCallMetadataData,
} from './voice-call-metadata.repository.interface.js';

// LiveKit Agent Config Repository
export type {
  ILivekitAgentConfigRepository,
  LivekitAgentConfigRecord,
} from './livekit-agent-config.repository.interface.js';

// LiveKit Call Event Repository
export type {
  ILivekitCallEventRepository,
  LivekitCallEventRecord,
  CreateLivekitCallEventData,
} from './livekit-call-event.repository.interface.js';

// Chat Debug Log Repository
export type {
  IChatDebugLogRepository,
  ChatDebugLogRecord,
  CreateChatDebugLogData,
} from './chat-debug-log.repository.interface.js';
