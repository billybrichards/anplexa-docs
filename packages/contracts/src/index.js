"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.z = exports.GroupedConversationsSchema = exports.DeleteConversationResponseSchema = exports.ConversationMessagesResponseSchema = exports.ConversationDetailResponseSchema = exports.ConversationListResponseSchema = exports.ConversationSummarySchema = exports.GetConversationsRequestSchema = exports.DeleteConversationRequestSchema = exports.SaveMessagesRequestSchema = exports.UpdateConversationRequestSchema = exports.CreateConversationRequestSchema = exports.UserProfileSchema = exports.PurchaseCreditsRequestSchema = exports.UpdateUserPreferencesRequestSchema = exports.UpdateUserProfileRequestSchema = exports.CreditsInfoSchema = exports.CreditTransactionSchema = exports.SubscriptionInfoSchema = exports.UserPreferencesSchema = exports.AmplexaProfileSchema = exports.SSEEventSchema = exports.SSEErrorEventSchema = exports.SSEDoneEventSchema = exports.SSETokenEventSchema = exports.SSEStartEventSchema = exports.ConversationDTOSchema = exports.MessageDTOSchema = exports.ChatRequestSchema = exports.ChatPreferencesSchema = exports.CreditsWebhookPayloadSchema = exports.SubscriptionWebhookPayloadSchema = exports.ProductDTOSchema = exports.PriceDTOSchema = exports.CreateCheckoutRequestSchema = exports.UserDTOSchema = exports.UpdateChatNameRequestSchema = exports.UpdatePersonalityRequestSchema = exports.PersonalityModeSchema = exports.ExchangeTokenRequestSchema = exports.MagicLinkVerifyRequestSchema = exports.MagicLinkRequestSchema = exports.ResetPasswordRequestSchema = exports.ForgotPasswordRequestSchema = exports.RefreshTokenRequestSchema = exports.LoginRequestSchema = exports.RegisterRequestSchema = void 0;
var auth_1 = require("./auth");
Object.defineProperty(exports, "RegisterRequestSchema", { enumerable: true, get: function () { return auth_1.RegisterRequestSchema; } });
Object.defineProperty(exports, "LoginRequestSchema", { enumerable: true, get: function () { return auth_1.LoginRequestSchema; } });
Object.defineProperty(exports, "RefreshTokenRequestSchema", { enumerable: true, get: function () { return auth_1.RefreshTokenRequestSchema; } });
Object.defineProperty(exports, "ForgotPasswordRequestSchema", { enumerable: true, get: function () { return auth_1.ForgotPasswordRequestSchema; } });
Object.defineProperty(exports, "ResetPasswordRequestSchema", { enumerable: true, get: function () { return auth_1.ResetPasswordRequestSchema; } });
Object.defineProperty(exports, "MagicLinkRequestSchema", { enumerable: true, get: function () { return auth_1.MagicLinkRequestSchema; } });
Object.defineProperty(exports, "MagicLinkVerifyRequestSchema", { enumerable: true, get: function () { return auth_1.MagicLinkVerifyRequestSchema; } });
Object.defineProperty(exports, "ExchangeTokenRequestSchema", { enumerable: true, get: function () { return auth_1.ExchangeTokenRequestSchema; } });
Object.defineProperty(exports, "PersonalityModeSchema", { enumerable: true, get: function () { return auth_1.PersonalityModeSchema; } });
Object.defineProperty(exports, "UpdatePersonalityRequestSchema", { enumerable: true, get: function () { return auth_1.UpdatePersonalityRequestSchema; } });
Object.defineProperty(exports, "UpdateChatNameRequestSchema", { enumerable: true, get: function () { return auth_1.UpdateChatNameRequestSchema; } });
Object.defineProperty(exports, "UserDTOSchema", { enumerable: true, get: function () { return auth_1.UserDTOSchema; } });
var stripe_1 = require("./stripe");
Object.defineProperty(exports, "CreateCheckoutRequestSchema", { enumerable: true, get: function () { return stripe_1.CreateCheckoutRequestSchema; } });
Object.defineProperty(exports, "PriceDTOSchema", { enumerable: true, get: function () { return stripe_1.PriceDTOSchema; } });
Object.defineProperty(exports, "ProductDTOSchema", { enumerable: true, get: function () { return stripe_1.ProductDTOSchema; } });
Object.defineProperty(exports, "SubscriptionWebhookPayloadSchema", { enumerable: true, get: function () { return stripe_1.SubscriptionWebhookPayloadSchema; } });
Object.defineProperty(exports, "CreditsWebhookPayloadSchema", { enumerable: true, get: function () { return stripe_1.CreditsWebhookPayloadSchema; } });
var chat_1 = require("./chat");
Object.defineProperty(exports, "ChatPreferencesSchema", { enumerable: true, get: function () { return chat_1.ChatPreferencesSchema; } });
Object.defineProperty(exports, "ChatRequestSchema", { enumerable: true, get: function () { return chat_1.ChatRequestSchema; } });
Object.defineProperty(exports, "MessageDTOSchema", { enumerable: true, get: function () { return chat_1.MessageDTOSchema; } });
Object.defineProperty(exports, "ConversationDTOSchema", { enumerable: true, get: function () { return chat_1.ConversationDTOSchema; } });
Object.defineProperty(exports, "SSEStartEventSchema", { enumerable: true, get: function () { return chat_1.SSEStartEventSchema; } });
Object.defineProperty(exports, "SSETokenEventSchema", { enumerable: true, get: function () { return chat_1.SSETokenEventSchema; } });
Object.defineProperty(exports, "SSEDoneEventSchema", { enumerable: true, get: function () { return chat_1.SSEDoneEventSchema; } });
Object.defineProperty(exports, "SSEErrorEventSchema", { enumerable: true, get: function () { return chat_1.SSEErrorEventSchema; } });
Object.defineProperty(exports, "SSEEventSchema", { enumerable: true, get: function () { return chat_1.SSEEventSchema; } });
Object.defineProperty(exports, "AmplexaProfileSchema", { enumerable: true, get: function () { return chat_1.AmplexaProfileSchema; } });
var user_1 = require("./user");
Object.defineProperty(exports, "UserPreferencesSchema", { enumerable: true, get: function () { return user_1.UserPreferencesSchema; } });
Object.defineProperty(exports, "SubscriptionInfoSchema", { enumerable: true, get: function () { return user_1.SubscriptionInfoSchema; } });
Object.defineProperty(exports, "CreditTransactionSchema", { enumerable: true, get: function () { return user_1.CreditTransactionSchema; } });
Object.defineProperty(exports, "CreditsInfoSchema", { enumerable: true, get: function () { return user_1.CreditsInfoSchema; } });
Object.defineProperty(exports, "UpdateUserProfileRequestSchema", { enumerable: true, get: function () { return user_1.UpdateUserProfileRequestSchema; } });
Object.defineProperty(exports, "UpdateUserPreferencesRequestSchema", { enumerable: true, get: function () { return user_1.UpdateUserPreferencesRequestSchema; } });
Object.defineProperty(exports, "PurchaseCreditsRequestSchema", { enumerable: true, get: function () { return user_1.PurchaseCreditsRequestSchema; } });
Object.defineProperty(exports, "UserProfileSchema", { enumerable: true, get: function () { return user_1.UserProfileSchema; } });
var conversation_1 = require("./conversation");
Object.defineProperty(exports, "CreateConversationRequestSchema", { enumerable: true, get: function () { return conversation_1.CreateConversationRequestSchema; } });
Object.defineProperty(exports, "UpdateConversationRequestSchema", { enumerable: true, get: function () { return conversation_1.UpdateConversationRequestSchema; } });
Object.defineProperty(exports, "SaveMessagesRequestSchema", { enumerable: true, get: function () { return conversation_1.SaveMessagesRequestSchema; } });
Object.defineProperty(exports, "DeleteConversationRequestSchema", { enumerable: true, get: function () { return conversation_1.DeleteConversationRequestSchema; } });
Object.defineProperty(exports, "GetConversationsRequestSchema", { enumerable: true, get: function () { return conversation_1.GetConversationsRequestSchema; } });
Object.defineProperty(exports, "ConversationSummarySchema", { enumerable: true, get: function () { return conversation_1.ConversationSummarySchema; } });
Object.defineProperty(exports, "ConversationListResponseSchema", { enumerable: true, get: function () { return conversation_1.ConversationListResponseSchema; } });
Object.defineProperty(exports, "ConversationDetailResponseSchema", { enumerable: true, get: function () { return conversation_1.ConversationDetailResponseSchema; } });
Object.defineProperty(exports, "ConversationMessagesResponseSchema", { enumerable: true, get: function () { return conversation_1.ConversationMessagesResponseSchema; } });
Object.defineProperty(exports, "DeleteConversationResponseSchema", { enumerable: true, get: function () { return conversation_1.DeleteConversationResponseSchema; } });
Object.defineProperty(exports, "GroupedConversationsSchema", { enumerable: true, get: function () { return conversation_1.GroupedConversationsSchema; } });
// ============================================================================
// Re-export Zod for convenience
// ============================================================================
var zod_1 = require("zod");
Object.defineProperty(exports, "z", { enumerable: true, get: function () { return zod_1.z; } });
