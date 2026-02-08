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
        length?: "brief" | "moderate" | "detailed";
        style?: "casual" | "thoughtful" | "creative";
    }, {
        length?: "brief" | "moderate" | "detailed";
        style?: "casual" | "thoughtful" | "creative";
    }>>;
    customPreferences: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    theme?: "light" | "dark" | "system";
    language?: string;
    notifications?: boolean;
    chatPreferences?: {
        length?: "brief" | "moderate" | "detailed";
        style?: "casual" | "thoughtful" | "creative";
    };
    customPreferences?: Record<string, unknown>;
}, {
    userId?: string;
    theme?: "light" | "dark" | "system";
    language?: string;
    notifications?: boolean;
    chatPreferences?: {
        length?: "brief" | "moderate" | "detailed";
        style?: "casual" | "thoughtful" | "creative";
    };
    customPreferences?: Record<string, unknown>;
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
    status?: "subscribed" | "not_subscribed" | "canceled" | "past_due";
    stripeCustomerId?: string;
    userId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    canceledAt?: string;
    cancelAtPeriodEnd?: boolean;
}, {
    status?: "subscribed" | "not_subscribed" | "canceled" | "past_due";
    stripeCustomerId?: string;
    userId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    canceledAt?: string;
    cancelAtPeriodEnd?: boolean;
}>;
export declare const CreditTransactionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    amount: z.ZodNumber;
    operation: z.ZodEnum<["set", "add", "subtract", "purchase"]>;
    reason: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
    userId?: string;
    amount?: number;
    operation?: "set" | "add" | "subtract" | "purchase";
    reason?: string;
    timestamp?: string;
}, {
    id?: string;
    userId?: string;
    amount?: number;
    operation?: "set" | "add" | "subtract" | "purchase";
    reason?: string;
    timestamp?: string;
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
        id?: string;
        userId?: string;
        amount?: number;
        operation?: "set" | "add" | "subtract" | "purchase";
        reason?: string;
        timestamp?: string;
    }, {
        id?: string;
        userId?: string;
        amount?: number;
        operation?: "set" | "add" | "subtract" | "purchase";
        reason?: string;
        timestamp?: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    balance?: number;
    lastUpdated?: string;
    history?: {
        id?: string;
        userId?: string;
        amount?: number;
        operation?: "set" | "add" | "subtract" | "purchase";
        reason?: string;
        timestamp?: string;
    }[];
}, {
    userId?: string;
    balance?: number;
    lastUpdated?: string;
    history?: {
        id?: string;
        userId?: string;
        amount?: number;
        operation?: "set" | "add" | "subtract" | "purchase";
        reason?: string;
        timestamp?: string;
    }[];
}>;
export declare const UpdateUserProfileRequestSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    displayName?: string;
}, {
    email?: string;
    displayName?: string;
}>;
export declare const UpdateUserPreferencesRequestSchema: z.ZodObject<{
    theme: z.ZodOptional<z.ZodEnum<["light", "dark", "system"]>>;
    language: z.ZodOptional<z.ZodString>;
    notifications: z.ZodOptional<z.ZodBoolean>;
    chatPreferences: z.ZodOptional<z.ZodObject<{
        length: z.ZodOptional<z.ZodEnum<["brief", "moderate", "detailed"]>>;
        style: z.ZodOptional<z.ZodEnum<["casual", "thoughtful", "creative"]>>;
    }, "strip", z.ZodTypeAny, {
        length?: "brief" | "moderate" | "detailed";
        style?: "casual" | "thoughtful" | "creative";
    }, {
        length?: "brief" | "moderate" | "detailed";
        style?: "casual" | "thoughtful" | "creative";
    }>>;
    customPreferences: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    theme?: "light" | "dark" | "system";
    language?: string;
    notifications?: boolean;
    chatPreferences?: {
        length?: "brief" | "moderate" | "detailed";
        style?: "casual" | "thoughtful" | "creative";
    };
    customPreferences?: Record<string, unknown>;
}, {
    theme?: "light" | "dark" | "system";
    language?: string;
    notifications?: boolean;
    chatPreferences?: {
        length?: "brief" | "moderate" | "detailed";
        style?: "casual" | "thoughtful" | "creative";
    };
    customPreferences?: Record<string, unknown>;
}>;
export declare const PurchaseCreditsRequestSchema: z.ZodObject<{
    amount: z.ZodNumber;
    paymentMethodId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount?: number;
    paymentMethodId?: string;
}, {
    amount?: number;
    paymentMethodId?: string;
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
    updatedAt?: string;
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
    updatedAt?: string;
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