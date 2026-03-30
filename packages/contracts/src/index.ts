/**
 * @anplexa/contracts - Shared Type Definitions
 *
 * Central export point for all API type definitions.
 * These contracts define the interface between frontend and backend services.
 *
 * IMPORTANT: Changes to these types must be backward compatible.
 * Never remove fields - only add new ones with optional chaining.
 *
 * Architecture:
 * - auth.ts: Authentication and user identity types
 * - stripe.ts: Payment, subscription, and webhook types
 * - chat.ts: Chat messaging and conversation streaming types
 * - user.ts: User profile, preferences, and credits types
 * - conversation.ts: Conversation management types
 *
 * All types include corresponding Zod validation schemas for runtime validation.
 */

// ============================================================================
// Auth Contracts & Schemas
// ============================================================================

export type {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MagicLinkRequest,
  MagicLinkVerifyRequest,
  ExchangeTokenRequest,
  UpdatePersonalityRequest,
  UpdateChatNameRequest,
  UserDTO,
  AuthTokens,
  RegisterResponse,
  LoginResponse,
  RefreshTokenResponse,
  SubscriptionStatusResponse,
  MeResponse,
  AuthError,
  ValidationError,
  PersonalityMode,
} from './auth.js';

export {
  RegisterRequestSchema,
  LoginRequestSchema,
  RefreshTokenRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  MagicLinkRequestSchema,
  MagicLinkVerifyRequestSchema,
  ExchangeTokenRequestSchema,
  PersonalityModeSchema,
  UpdatePersonalityRequestSchema,
  UpdateChatNameRequestSchema,
  UserDTOSchema,
} from './auth.js';

export type {
  ValidatedRegisterRequest,
  ValidatedLoginRequest,
  ValidatedRefreshTokenRequest,
  ValidatedResetPasswordRequest,
  ValidatedMagicLinkRequest,
  ValidatedUpdatePersonalityRequest,
  ValidatedUpdateChatNameRequest,
} from './auth.js';

// ============================================================================
// Stripe/Payment Contracts & Schemas
// ============================================================================

export type {
  CreateCheckoutRequest,
  PublishableKeyResponse,
  PriceDTO,
  ProductDTO,
  ProductListResponse,
  CheckoutSessionResponse,
  SubscriptionWebhookPayload,
  CreditsWebhookPayload,
  StripeWebhookEvent,
} from './stripe.js';

export {
  CreateCheckoutRequestSchema,
  PriceDTOSchema,
  ProductDTOSchema,
  SubscriptionWebhookPayloadSchema,
  CreditsWebhookPayloadSchema,
} from './stripe.js';

export type {
  ValidatedCreateCheckoutRequest,
  ValidatedSubscriptionWebhookPayload,
  ValidatedCreditsWebhookPayload,
} from './stripe.js';

// ============================================================================
// Chat Contracts & Schemas
// ============================================================================

export type {
  ChatPreferences,
  ChatRequest,
  MessageRole,
  MessageSource,
  MessageDTO,
  ConversationDTO,
  ConversationWithMessagesDTO,
  ChatConfigResponse,
  AgentActivityStatus,
  SSEStartEvent,
  SSETokenEvent,
  SSEActivityEvent,
  SSEDoneEvent,
  SSEErrorEvent,
  SSEEvent,
  AmplexaProfile,
  ChatError,
  InsufficientCreditsError,
  RateLimitErrorResponse,
} from './chat.js';

export {
  ChatPreferencesSchema,
  ChatRequestSchema,
  MessageSourceSchema,
  MessageDTOSchema,
  ConversationDTOSchema,
  SSEStartEventSchema,
  SSETokenEventSchema,
  SSEActivityEventSchema,
  SSEDoneEventSchema,
  SSEErrorEventSchema,
  SSEEventSchema,
  AmplexaProfileSchema,
} from './chat.js';

export type {
  ValidatedChatRequest,
  ValidatedChatPreferences,
  ValidatedMessageDTO,
  ValidatedConversationDTO,
  ValidatedSSEEvent,
  ValidatedAmplexaProfile,
} from './chat.js';

// ============================================================================
// Voice/Video Contracts & Schemas
// ============================================================================

export type {
  LiveKitTokenRequest,
  LiveKitTokenResponse,
  LiveKitConfigResponse,
  CallEventDTO,
  CallSummaryRequest,
  CompanionVoiceDTO,
} from './voice.js';

export {
  LiveKitTokenRequestSchema,
  CallEventDTOSchema,
  CallEventsRequestSchema,
  CallSummaryRequestSchema,
} from './voice.js';

export type {
  ValidatedLiveKitTokenRequest,
  ValidatedCallEventDTO,
  ValidatedCallSummaryRequest,
} from './voice.js';

// ============================================================================
// User Contracts & Schemas
// ============================================================================

export type {
  UserProfile,
  UserPreferences,
  SubscriptionStatus,
  SubscriptionInfo,
  CreditsInfo,
  CreditTransaction,
  UpdateUserProfileRequest,
  UpdateUserPreferencesRequest,
  PurchaseCreditsRequest,
  UserProfileResponse,
  UserPreferencesResponse,
  CreditsBalanceResponse,
  CreditsHistoryResponse,
  UpdateProfileResponse,
} from './user.js';

export {
  UserPreferencesSchema,
  SubscriptionInfoSchema,
  CreditTransactionSchema,
  CreditsInfoSchema,
  UpdateUserProfileRequestSchema,
  UpdateUserPreferencesRequestSchema,
  PurchaseCreditsRequestSchema,
  UserProfileSchema,
} from './user.js';

export type {
  ValidatedUserPreferences,
  ValidatedSubscriptionInfo,
  ValidatedCreditsInfo,
  ValidatedCreditTransaction,
  ValidatedUpdateUserProfileRequest,
  ValidatedUpdateUserPreferencesRequest,
  ValidatedPurchaseCreditsRequest,
  ValidatedUserProfile,
} from './user.js';

// ============================================================================
// Conversation Contracts & Schemas
// ============================================================================

export type {
  CreateConversationRequest,
  UpdateConversationRequest,
  SaveMessagesRequest,
  DeleteConversationRequest,
  GetConversationsRequest,
  ConversationSummary,
  ConversationListResponse,
  ConversationDetailResponse,
  ConversationMessagesResponse,
  DeleteConversationResponse,
  GroupedConversations,
} from './conversation.js';

export {
  CreateConversationRequestSchema,
  UpdateConversationRequestSchema,
  SaveMessagesRequestSchema,
  DeleteConversationRequestSchema,
  GetConversationsRequestSchema,
  ConversationSummarySchema,
  ConversationListResponseSchema,
  ConversationDetailResponseSchema,
  ConversationMessagesResponseSchema,
  DeleteConversationResponseSchema,
  GroupedConversationsSchema,
} from './conversation.js';

export type {
  ValidatedCreateConversationRequest,
  ValidatedUpdateConversationRequest,
  ValidatedSaveMessagesRequest,
  ValidatedDeleteConversationRequest,
  ValidatedGetConversationsRequest,
  ValidatedConversationSummary,
  ValidatedConversationListResponse,
  ValidatedConversationDetailResponse,
  ValidatedConversationMessagesResponse,
  ValidatedGroupedConversations,
} from './conversation.js';

// ============================================================================
// Re-export Zod for convenience
// ============================================================================

export { z } from 'zod';
