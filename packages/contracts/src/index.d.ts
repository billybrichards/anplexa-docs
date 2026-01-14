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
export type { RegisterRequest, LoginRequest, RefreshTokenRequest, ForgotPasswordRequest, ResetPasswordRequest, MagicLinkRequest, MagicLinkVerifyRequest, ExchangeTokenRequest, UpdatePersonalityRequest, UpdateChatNameRequest, UserDTO, AuthTokens, RegisterResponse, LoginResponse, RefreshTokenResponse, SubscriptionStatusResponse, MeResponse, AuthError, ValidationError, PersonalityMode, } from './auth';
export { RegisterRequestSchema, LoginRequestSchema, RefreshTokenRequestSchema, ForgotPasswordRequestSchema, ResetPasswordRequestSchema, MagicLinkRequestSchema, MagicLinkVerifyRequestSchema, ExchangeTokenRequestSchema, PersonalityModeSchema, UpdatePersonalityRequestSchema, UpdateChatNameRequestSchema, UserDTOSchema, } from './auth';
export type { ValidatedRegisterRequest, ValidatedLoginRequest, ValidatedRefreshTokenRequest, ValidatedResetPasswordRequest, ValidatedMagicLinkRequest, ValidatedUpdatePersonalityRequest, ValidatedUpdateChatNameRequest, } from './auth';
export type { CreateCheckoutRequest, PublishableKeyResponse, PriceDTO, ProductDTO, ProductListResponse, CheckoutSessionResponse, SubscriptionWebhookPayload, CreditsWebhookPayload, StripeWebhookEvent, } from './stripe';
export { CreateCheckoutRequestSchema, PriceDTOSchema, ProductDTOSchema, SubscriptionWebhookPayloadSchema, CreditsWebhookPayloadSchema, } from './stripe';
export type { ValidatedCreateCheckoutRequest, ValidatedSubscriptionWebhookPayload, ValidatedCreditsWebhookPayload, } from './stripe';
export type { ChatPreferences, ChatRequest, MessageRole, MessageDTO, ConversationDTO, ConversationWithMessagesDTO, ChatConfigResponse, SSEStartEvent, SSETokenEvent, SSEDoneEvent, SSEErrorEvent, SSEEvent, AmplexaProfile, ChatError, InsufficientCreditsError, } from './chat';
export { ChatPreferencesSchema, ChatRequestSchema, MessageDTOSchema, ConversationDTOSchema, SSEStartEventSchema, SSETokenEventSchema, SSEDoneEventSchema, SSEErrorEventSchema, SSEEventSchema, AmplexaProfileSchema, } from './chat';
export type { ValidatedChatRequest, ValidatedChatPreferences, ValidatedMessageDTO, ValidatedConversationDTO, ValidatedSSEEvent, ValidatedAmplexaProfile, } from './chat';
export type { UserProfile, UserPreferences, SubscriptionStatus, SubscriptionInfo, CreditsInfo, CreditTransaction, UpdateUserProfileRequest, UpdateUserPreferencesRequest, PurchaseCreditsRequest, UserProfileResponse, UserPreferencesResponse, CreditsBalanceResponse, CreditsHistoryResponse, UpdateProfileResponse, } from './user';
export { UserPreferencesSchema, SubscriptionInfoSchema, CreditTransactionSchema, CreditsInfoSchema, UpdateUserProfileRequestSchema, UpdateUserPreferencesRequestSchema, PurchaseCreditsRequestSchema, UserProfileSchema, } from './user';
export type { ValidatedUserPreferences, ValidatedSubscriptionInfo, ValidatedCreditsInfo, ValidatedCreditTransaction, ValidatedUpdateUserProfileRequest, ValidatedUpdateUserPreferencesRequest, ValidatedPurchaseCreditsRequest, ValidatedUserProfile, } from './user';
export type { CreateConversationRequest, UpdateConversationRequest, SaveMessagesRequest, DeleteConversationRequest, GetConversationsRequest, ConversationSummary, ConversationListResponse, ConversationDetailResponse, ConversationMessagesResponse, DeleteConversationResponse, GroupedConversations, } from './conversation';
export { CreateConversationRequestSchema, UpdateConversationRequestSchema, SaveMessagesRequestSchema, DeleteConversationRequestSchema, GetConversationsRequestSchema, ConversationSummarySchema, ConversationListResponseSchema, ConversationDetailResponseSchema, ConversationMessagesResponseSchema, DeleteConversationResponseSchema, GroupedConversationsSchema, } from './conversation';
export type { ValidatedCreateConversationRequest, ValidatedUpdateConversationRequest, ValidatedSaveMessagesRequest, ValidatedDeleteConversationRequest, ValidatedGetConversationsRequest, ValidatedConversationSummary, ValidatedConversationListResponse, ValidatedConversationDetailResponse, ValidatedConversationMessagesResponse, ValidatedGroupedConversations, } from './conversation';
export { z } from 'zod';
//# sourceMappingURL=index.d.ts.map