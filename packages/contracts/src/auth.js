/**
 * Auth API Contracts
 *
 * Shared type definitions for authentication endpoints.
 * These types define the API contract between frontend and backend.
 * Includes Zod validation schemas for request validation.
 */
import { z } from 'zod';
// ============================================================================
// Zod Validation Schemas
// ============================================================================
const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const tokenSchema = z.string().min(1, 'Token is required');
export const RegisterRequestSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    displayName: z.string().max(255).optional(),
});
export const LoginRequestSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});
export const RefreshTokenRequestSchema = z.object({
    refreshToken: tokenSchema,
});
export const ForgotPasswordRequestSchema = z.object({
    email: emailSchema,
});
export const ResetPasswordRequestSchema = z.object({
    token: tokenSchema,
    newPassword: passwordSchema,
});
export const MagicLinkRequestSchema = z.object({
    email: emailSchema,
});
export const MagicLinkVerifyRequestSchema = z.object({
    token: tokenSchema,
});
export const ExchangeTokenRequestSchema = z.object({
    code: z.string().min(1, 'Code is required'),
});
export const PersonalityModeSchema = z.enum([
    'nurturing',
    'playful',
    'dominant',
    'filthy_sexy',
    'intimate_companion',
    'intellectual_muse',
]);
export const UpdatePersonalityRequestSchema = z.object({
    personalityMode: PersonalityModeSchema,
});
export const UpdateChatNameRequestSchema = z.object({
    chatName: z.string().min(1, 'Chat name is required').max(255),
});
export const UserDTOSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    displayName: z.string().nullable(),
    isAdmin: z.boolean(),
    subscriptionStatus: z.enum(['subscribed', 'not_subscribed']).optional(),
    chatName: z.string().nullable().optional(),
    personalityMode: PersonalityModeSchema.nullable().optional(),
    credits: z.number().nonnegative().optional(),
    stripeCustomerId: z.string().nullable().optional(),
    createdAt: z.string().optional(),
});
