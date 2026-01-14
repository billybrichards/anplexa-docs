/**
 * User API Contracts
 *
 * Shared type definitions for user-related endpoints.
 * Includes user preferences, subscription status, and credits management.
 * Includes Zod validation schemas for request validation.
 */
import { z } from 'zod';
import type { PersonalityMode } from './auth';
export interface UserProfile {
    id: string;
    email: string;
    displayName: string | null;
    chatName: string | null;
    personalityMode: PersonalityMode | null;
    isAdmin: boolean;
    credits: number;
    subscriptionStatus: 'subscribed' | 'not_subscribed';
    stripeCustomerId: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface UserPreferences {
    userId: string;
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: boolean;
    chatPreferences?: {
        length?: 'brief' | 'moderate' | 'detailed';
        style?: 'casual' | 'thoughtful' | 'creative';
    };
    customPreferences?: Record<string, unknown>;
}
export type SubscriptionStatus = 'subscribed' | 'not_subscribed' | 'canceled' | 'past_due';
export interface SubscriptionInfo {
    userId: string;
    status: SubscriptionStatus;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    canceledAt?: string;
    cancelAtPeriodEnd?: boolean;
}
export interface CreditsInfo {
    userId: string;
    balance: number;
    lastUpdated: string;
    history?: CreditTransaction[];
}
export interface CreditTransaction {
    id: string;
    userId: string;
    amount: number;
    operation: 'set' | 'add' | 'subtract' | 'purchase';
    reason?: string;
    timestamp: string;
}
export interface UpdateUserProfileRequest {
    displayName?: string;
    email?: string;
}
export interface UpdateUserPreferencesRequest {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: boolean;
    chatPreferences?: {
        length?: 'brief' | 'moderate' | 'detailed';
        style?: 'casual' | 'thoughtful' | 'creative';
    };
    customPreferences?: Record<string, unknown>;
}
export interface PurchaseCreditsRequest {
    amount: number;
    paymentMethodId?: string;
}
export interface UserProfileResponse {
    user: UserProfile;
}
export interface UserPreferencesResponse {
    preferences: UserPreferences;
}
export interface CreditsBalanceResponse {
    userId: string;
    balance: number;
    lastUpdated: string;
}
export interface CreditsHistoryResponse {
    userId: string;
    transactions: CreditTransaction[];
    total: number;
}
export interface UpdateProfileResponse {
    user: UserProfile;
    message: string;
}
export declare const UserPreferencesSchema: z.ZodObject<{
    userId: z.ZodString;
    theme: z.ZodOptional<z.ZodEnum<["light", "dark", "system"]>>;
    language: z.ZodOptional<z.ZodString>;
    notifications: z.ZodOptional<z.ZodBoolean>;
    chatPreferences: z.ZodOptional<z.ZodObject<{
        length: z.ZodOptional<z.ZodEnum<["brief", "moderate", "detailed"]>>;
        style: z.ZodOptional<z.ZodEnum<["casual", "thoughtful", "creative"]>>;
    }, "strip", z.ZodTypeAny, {
        length?: "moderate" | "brief" | "detailed" | undefined;
        style?: "thoughtful" | "casual" | "creative" | undefined;
    }, {
        length?: "moderate" | "brief" | "detailed" | undefined;
        style?: "thoughtful" | "casual" | "creative" | undefined;
    }>>;
    customPreferences: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    theme?: "system" | "light" | "dark" | undefined;
    language?: string | undefined;
    notifications?: boolean | undefined;
    chatPreferences?: {
        length?: "moderate" | "brief" | "detailed" | undefined;
        style?: "thoughtful" | "casual" | "creative" | undefined;
    } | undefined;
    customPreferences?: Record<string, unknown> | undefined;
}, {
    userId: string;
    theme?: "system" | "light" | "dark" | undefined;
    language?: string | undefined;
    notifications?: boolean | undefined;
    chatPreferences?: {
        length?: "moderate" | "brief" | "detailed" | undefined;
        style?: "thoughtful" | "casual" | "creative" | undefined;
    } | undefined;
    customPreferences?: Record<string, unknown> | undefined;
}>;
export declare const SubscriptionInfoSchema: z.ZodObject<{
    userId: z.ZodString;
    status: z.ZodEnum<["subscribed", "not_subscribed", "canceled", "past_due"]>;
    stripeCustomerId: z.ZodNullable<z.ZodString>;
    stripeSubscriptionId: z.ZodNullable<z.ZodString>;
    currentPeriodStart: z.ZodOptional<z.ZodString>;
    currentPeriodEnd: z.ZodOptional<z.ZodString>;
    canceledAt: z.ZodOptional<z.ZodString>;
    cancelAtPeriodEnd: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    userId: string;
    status: "not_subscribed" | "subscribed" | "canceled" | "past_due";
    currentPeriodStart?: string | undefined;
    currentPeriodEnd?: string | undefined;
    canceledAt?: string | undefined;
    cancelAtPeriodEnd?: boolean | undefined;
}, {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    userId: string;
    status: "not_subscribed" | "subscribed" | "canceled" | "past_due";
    currentPeriodStart?: string | undefined;
    currentPeriodEnd?: string | undefined;
    canceledAt?: string | undefined;
    cancelAtPeriodEnd?: boolean | undefined;
}>;
export declare const CreditTransactionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    amount: z.ZodNumber;
    operation: z.ZodEnum<["set", "add", "subtract", "purchase"]>;
    reason: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    timestamp: string;
    userId: string;
    operation: "set" | "add" | "subtract" | "purchase";
    amount: number;
    reason?: string | undefined;
}, {
    id: string;
    timestamp: string;
    userId: string;
    operation: "set" | "add" | "subtract" | "purchase";
    amount: number;
    reason?: string | undefined;
}>;
export declare const CreditsInfoSchema: z.ZodObject<{
    userId: z.ZodString;
    balance: z.ZodNumber;
    lastUpdated: z.ZodString;
    history: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        amount: z.ZodNumber;
        operation: z.ZodEnum<["set", "add", "subtract", "purchase"]>;
        reason: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        timestamp: string;
        userId: string;
        operation: "set" | "add" | "subtract" | "purchase";
        amount: number;
        reason?: string | undefined;
    }, {
        id: string;
        timestamp: string;
        userId: string;
        operation: "set" | "add" | "subtract" | "purchase";
        amount: number;
        reason?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    balance: number;
    lastUpdated: string;
    history?: {
        id: string;
        timestamp: string;
        userId: string;
        operation: "set" | "add" | "subtract" | "purchase";
        amount: number;
        reason?: string | undefined;
    }[] | undefined;
}, {
    userId: string;
    balance: number;
    lastUpdated: string;
    history?: {
        id: string;
        timestamp: string;
        userId: string;
        operation: "set" | "add" | "subtract" | "purchase";
        amount: number;
        reason?: string | undefined;
    }[] | undefined;
}>;
export declare const UpdateUserProfileRequestSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    displayName?: string | undefined;
}, {
    email?: string | undefined;
    displayName?: string | undefined;
}>;
export declare const UpdateUserPreferencesRequestSchema: z.ZodObject<{
    theme: z.ZodOptional<z.ZodEnum<["light", "dark", "system"]>>;
    language: z.ZodOptional<z.ZodString>;
    notifications: z.ZodOptional<z.ZodBoolean>;
    chatPreferences: z.ZodOptional<z.ZodObject<{
        length: z.ZodOptional<z.ZodEnum<["brief", "moderate", "detailed"]>>;
        style: z.ZodOptional<z.ZodEnum<["casual", "thoughtful", "creative"]>>;
    }, "strip", z.ZodTypeAny, {
        length?: "moderate" | "brief" | "detailed" | undefined;
        style?: "thoughtful" | "casual" | "creative" | undefined;
    }, {
        length?: "moderate" | "brief" | "detailed" | undefined;
        style?: "thoughtful" | "casual" | "creative" | undefined;
    }>>;
    customPreferences: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    theme?: "system" | "light" | "dark" | undefined;
    language?: string | undefined;
    notifications?: boolean | undefined;
    chatPreferences?: {
        length?: "moderate" | "brief" | "detailed" | undefined;
        style?: "thoughtful" | "casual" | "creative" | undefined;
    } | undefined;
    customPreferences?: Record<string, unknown> | undefined;
}, {
    theme?: "system" | "light" | "dark" | undefined;
    language?: string | undefined;
    notifications?: boolean | undefined;
    chatPreferences?: {
        length?: "moderate" | "brief" | "detailed" | undefined;
        style?: "thoughtful" | "casual" | "creative" | undefined;
    } | undefined;
    customPreferences?: Record<string, unknown> | undefined;
}>;
export declare const PurchaseCreditsRequestSchema: z.ZodObject<{
    amount: z.ZodNumber;
    paymentMethodId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    paymentMethodId?: string | undefined;
}, {
    amount: number;
    paymentMethodId?: string | undefined;
}>;
export declare const UserProfileSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    chatName: z.ZodNullable<z.ZodString>;
    personalityMode: z.ZodNullable<z.ZodEnum<["nurturing", "playful", "dominant", "filthy_sexy", "intimate_companion", "intellectual_muse"]>>;
    isAdmin: z.ZodBoolean;
    credits: z.ZodNumber;
    subscriptionStatus: z.ZodEnum<["subscribed", "not_subscribed"]>;
    stripeCustomerId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    displayName: string | null;
    chatName: string | null;
    personalityMode: "nurturing" | "playful" | "dominant" | "filthy_sexy" | "intimate_companion" | "intellectual_muse" | null;
    createdAt: string;
    updatedAt: string;
    isAdmin: boolean;
    subscriptionStatus: "not_subscribed" | "subscribed";
    credits: number;
    stripeCustomerId: string | null;
}, {
    id: string;
    email: string;
    displayName: string | null;
    chatName: string | null;
    personalityMode: "nurturing" | "playful" | "dominant" | "filthy_sexy" | "intimate_companion" | "intellectual_muse" | null;
    createdAt: string;
    updatedAt: string;
    isAdmin: boolean;
    subscriptionStatus: "not_subscribed" | "subscribed";
    credits: number;
    stripeCustomerId: string | null;
}>;
export type ValidatedUserPreferences = z.infer<typeof UserPreferencesSchema>;
export type ValidatedSubscriptionInfo = z.infer<typeof SubscriptionInfoSchema>;
export type ValidatedCreditsInfo = z.infer<typeof CreditsInfoSchema>;
export type ValidatedCreditTransaction = z.infer<typeof CreditTransactionSchema>;
export type ValidatedUpdateUserProfileRequest = z.infer<typeof UpdateUserProfileRequestSchema>;
export type ValidatedUpdateUserPreferencesRequest = z.infer<typeof UpdateUserPreferencesRequestSchema>;
export type ValidatedPurchaseCreditsRequest = z.infer<typeof PurchaseCreditsRequestSchema>;
export type ValidatedUserProfile = z.infer<typeof UserProfileSchema>;
//# sourceMappingURL=user.d.ts.map