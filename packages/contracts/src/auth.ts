/**
 * Auth API Contracts
 *
 * Shared type definitions for authentication endpoints.
 * These types define the API contract between frontend and backend.
 * Includes Zod validation schemas for request validation.
 */

import { z } from 'zod';

// ============================================================================
// Request Types
// ============================================================================

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface MagicLinkRequest {
  email: string;
}

export interface MagicLinkVerifyRequest {
  token: string;
}

export interface ExchangeTokenRequest {
  code: string;
}

export interface UpdatePersonalityRequest {
  personalityMode: PersonalityMode;
}

export interface UpdateChatNameRequest {
  chatName: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface UserDTO {
  id: string;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
  subscriptionStatus?: 'subscribed' | 'not_subscribed';
  chatName?: string | null;
  personalityMode?: PersonalityMode | null;
  credits?: number;
  stripeCustomerId?: string | null;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  message: string;
  user: UserDTO;
  tokens: AuthTokens;
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  message: string;
  user: UserDTO;
  tokens: AuthTokens;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  message: string;
  tokens: AuthTokens;
  accessToken: string;
  refreshToken: string;
}

export interface SubscriptionStatusResponse {
  subscriptionStatus: 'subscribed' | 'not_subscribed';
  isSubscribed: boolean; // Backward compatibility
  credits: number;
  plan?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  hasStripeCustomer?: boolean;
  hasActiveSubscription?: boolean;
  timestamp: string;
}

export interface MeResponse {
  user: UserDTO & {
    chatName: string | null;
    personalityMode: string | null;
    credits: number;
    subscriptionStatus: 'subscribed' | 'not_subscribed';
    stripeCustomerId: string | null;
    createdAt: string;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export interface AuthError {
  error: string;
  message?: string;
  details?: unknown;
}

export interface ValidationError extends AuthError {
  details: Array<{
    path: (string | number)[];
    message: string;
  }>;
}

// ============================================================================
// Personality Types
// ============================================================================

export type PersonalityMode =
  | 'nurturing'
  | 'playful'
  | 'dominant'
  | 'filthy_sexy'
  | 'intimate_companion'
  | 'intellectual_muse';

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

// ============================================================================
// Type Inference from Zod Schemas
// ============================================================================

export type ValidatedRegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type ValidatedLoginRequest = z.infer<typeof LoginRequestSchema>;
export type ValidatedRefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type ValidatedResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ValidatedMagicLinkRequest = z.infer<typeof MagicLinkRequestSchema>;
export type ValidatedUpdatePersonalityRequest = z.infer<typeof UpdatePersonalityRequestSchema>;
export type ValidatedUpdateChatNameRequest = z.infer<typeof UpdateChatNameRequestSchema>;
