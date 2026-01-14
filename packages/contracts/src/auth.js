"use strict";
/**
 * Auth API Contracts
 *
 * Shared type definitions for authentication endpoints.
 * These types define the API contract between frontend and backend.
 * Includes Zod validation schemas for request validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDTOSchema = exports.UpdateChatNameRequestSchema = exports.UpdatePersonalityRequestSchema = exports.PersonalityModeSchema = exports.ExchangeTokenRequestSchema = exports.MagicLinkVerifyRequestSchema = exports.MagicLinkRequestSchema = exports.ResetPasswordRequestSchema = exports.ForgotPasswordRequestSchema = exports.RefreshTokenRequestSchema = exports.LoginRequestSchema = exports.RegisterRequestSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// Zod Validation Schemas
// ============================================================================
const emailSchema = zod_1.z.string().email('Invalid email address');
const passwordSchema = zod_1.z.string().min(8, 'Password must be at least 8 characters');
const tokenSchema = zod_1.z.string().min(1, 'Token is required');
exports.RegisterRequestSchema = zod_1.z.object({
    email: emailSchema,
    password: passwordSchema,
    displayName: zod_1.z.string().max(255).optional(),
});
exports.LoginRequestSchema = zod_1.z.object({
    email: emailSchema,
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.RefreshTokenRequestSchema = zod_1.z.object({
    refreshToken: tokenSchema,
});
exports.ForgotPasswordRequestSchema = zod_1.z.object({
    email: emailSchema,
});
exports.ResetPasswordRequestSchema = zod_1.z.object({
    token: tokenSchema,
    newPassword: passwordSchema,
});
exports.MagicLinkRequestSchema = zod_1.z.object({
    email: emailSchema,
});
exports.MagicLinkVerifyRequestSchema = zod_1.z.object({
    token: tokenSchema,
});
exports.ExchangeTokenRequestSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Code is required'),
});
exports.PersonalityModeSchema = zod_1.z.enum([
    'nurturing',
    'playful',
    'dominant',
    'filthy_sexy',
    'intimate_companion',
    'intellectual_muse',
]);
exports.UpdatePersonalityRequestSchema = zod_1.z.object({
    personalityMode: exports.PersonalityModeSchema,
});
exports.UpdateChatNameRequestSchema = zod_1.z.object({
    chatName: zod_1.z.string().min(1, 'Chat name is required').max(255),
});
exports.UserDTOSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string().email(),
    displayName: zod_1.z.string().nullable(),
    isAdmin: zod_1.z.boolean(),
    subscriptionStatus: zod_1.z.enum(['subscribed', 'not_subscribed']).optional(),
    chatName: zod_1.z.string().nullable().optional(),
    personalityMode: exports.PersonalityModeSchema.nullable().optional(),
    credits: zod_1.z.number().nonnegative().optional(),
    stripeCustomerId: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.string().optional(),
});
