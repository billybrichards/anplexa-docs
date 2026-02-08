/**
 * Auth API Contracts
 *
 * Shared type definitions for authentication endpoints.
 * These types define the API contract between frontend and backend.
 * Includes Zod validation schemas for request validation.
 */
import { z } from 'zod';
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
    isSubscribed: boolean;
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
export type PersonalityMode = 'nurturing' | 'playful' | 'dominant' | 'filthy_sexy' | 'intimate_companion' | 'intellectual_muse';
export declare const RegisterRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password?: string;
    displayName?: string;
}, {
    email?: string;
    password?: string;
    displayName?: string;
}>;
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password?: string;
}, {
    email?: string;
    password?: string;
}>;
export declare const RefreshTokenRequestSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken?: string;
}, {
    refreshToken?: string;
}>;
export declare const ForgotPasswordRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
}, {
    email?: string;
}>;
export declare const ResetPasswordRequestSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token?: string;
    newPassword?: string;
}, {
    token?: string;
    newPassword?: string;
}>;
export declare const MagicLinkRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
}, {
    email?: string;
}>;
export declare const MagicLinkVerifyRequestSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token?: string;
}, {
    token?: string;
}>;
export declare const ExchangeTokenRequestSchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code?: string;
}, {
    code?: string;
}>;
export declare const PersonalityModeSchema: z.ZodEnum<["nurturing", "playful", "dominant", "filthy_sexy", "intimate_companion", "intellectual_muse"]>;
export declare const UpdatePersonalityRequestSchema: z.ZodObject<{
    personalityMode: z.ZodEnum<["nurturing", "playful", "dominant", "filthy_sexy", "intimate_companion", "intellectual_muse"]>;
}, "strip", z.ZodTypeAny, {
    personalityMode?: "nurturing" | "playful" | "dominant" | "filthy_sexy" | "intimate_companion" | "intellectual_muse";
}, {
    personalityMode?: "nurturing" | "playful" | "dominant" | "filthy_sexy" | "intimate_companion" | "intellectual_muse";
}>;
export declare const UpdateChatNameRequestSchema: z.ZodObject<{
    chatName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    chatName?: string;
}, {
    chatName?: string;
}>;
export declare const UserDTOSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    isAdmin: z.ZodBoolean;
    subscriptionStatus: z.ZodOptional<z.ZodEnum<["subscribed", "not_subscribed"]>>;
    chatName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    personalityMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["nurturing", "playful", "dominant", "filthy_sexy", "intimate_companion", "intellectual_muse"]>>>;
    credits: z.ZodOptional<z.ZodNumber>;
    stripeCustomerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    displayName?: string;
    personalityMode?: "nurturing" | "playful" | "dominant" | "filthy_sexy" | "intimate_companion" | "intellectual_muse";
    chatName?: string;
    id?: string;
    isAdmin?: boolean;
    subscriptionStatus?: "subscribed" | "not_subscribed";
    credits?: number;
    stripeCustomerId?: string;
    createdAt?: string;
}, {
    email?: string;
    displayName?: string;
    personalityMode?: "nurturing" | "playful" | "dominant" | "filthy_sexy" | "intimate_companion" | "intellectual_muse";
    chatName?: string;
    id?: string;
    isAdmin?: boolean;
    subscriptionStatus?: "subscribed" | "not_subscribed";
    credits?: number;
    stripeCustomerId?: string;
    createdAt?: string;
}>;
export type ValidatedRegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type ValidatedLoginRequest = z.infer<typeof LoginRequestSchema>;
export type ValidatedRefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type ValidatedResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ValidatedMagicLinkRequest = z.infer<typeof MagicLinkRequestSchema>;
export type ValidatedUpdatePersonalityRequest = z.infer<typeof UpdatePersonalityRequestSchema>;
export type ValidatedUpdateChatNameRequest = z.infer<typeof UpdateChatNameRequestSchema>;
//# sourceMappingURL=auth.d.ts.map