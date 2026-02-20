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
export { RegisterRequestSchema, LoginRequestSchema, RefreshTokenRequestSchema, ForgotPasswordRequestSchema, ResetPasswordRequestSchema, MagicLinkRequestSchema, MagicLinkVerifyRequestSchema, ExchangeTokenRequestSchema, PersonalityModeSchema, UpdatePersonalityRequestSchema, UpdateChatNameRequestSchema, UserDTOSchema, } from './auth';
export { CreateCheckoutRequestSchema, PriceDTOSchema, ProductDTOSchema, SubscriptionWebhookPayloadSchema, CreditsWebhookPayloadSchema, } from './stripe';
export { ChatPreferencesSchema, ChatRequestSchema, MessageDTOSchema, ConversationDTOSchema, SSEStartEventSchema, SSETokenEventSchema, SSEDoneEventSchema, SSEErrorEventSchema, SSEEventSchema, AmplexaProfileSchema, } from './chat';
export { UserPreferencesSchema, SubscriptionInfoSchema, CreditTransactionSchema, CreditsInfoSchema, UpdateUserProfileRequestSchema, UpdateUserPreferencesRequestSchema, PurchaseCreditsRequestSchema, UserProfileSchema, } from './user';
export { CreateConversationRequestSchema, UpdateConversationRequestSchema, SaveMessagesRequestSchema, DeleteConversationRequestSchema, GetConversationsRequestSchema, ConversationSummarySchema, ConversationListResponseSchema, ConversationDetailResponseSchema, ConversationMessagesResponseSchema, DeleteConversationResponseSchema, GroupedConversationsSchema, } from './conversation';
// ============================================================================
// Re-export Zod for convenience
// ============================================================================
export { z } from 'zod';
