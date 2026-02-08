/**
 * User API Contracts
 *
 * Shared type definitions for user-related endpoints.
 * Includes user preferences, subscription status, and credits management.
 * Includes Zod validation schemas for request validation.
 */
import { z } from 'zod';
// ============================================================================
// Zod Validation Schemas
// ============================================================================
const uuidSchema = z.string().uuid();
const emailSchema = z.string().email('Invalid email address');
const themeSchema = z.enum(['light', 'dark', 'system']);
const lengthSchema = z.enum(['brief', 'moderate', 'detailed']);
const styleSchema = z.enum(['casual', 'thoughtful', 'creative']);
const personalityModeSchema = z.enum([
    'nurturing',
    'playful',
    'dominant',
    'filthy_sexy',
    'intimate_companion',
    'intellectual_muse',
]);
export const UserPreferencesSchema = z.object({
    userId: uuidSchema,
    theme: themeSchema.optional(),
    language: z.string().optional(),
    notifications: z.boolean().optional(),
    chatPreferences: z
        .object({
        length: lengthSchema.optional(),
        style: styleSchema.optional(),
    })
        .optional(),
    customPreferences: z.record(z.unknown()).optional(),
});
export const SubscriptionInfoSchema = z.object({
    userId: uuidSchema,
    status: z.enum(['subscribed', 'not_subscribed', 'canceled', 'past_due']),
    stripeCustomerId: z.string().nullable(),
    stripeSubscriptionId: z.string().nullable(),
    currentPeriodStart: z.string().datetime().optional(),
    currentPeriodEnd: z.string().datetime().optional(),
    canceledAt: z.string().datetime().optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
});
export const CreditTransactionSchema = z.object({
    id: uuidSchema,
    userId: uuidSchema,
    amount: z.number(),
    operation: z.enum(['set', 'add', 'subtract', 'purchase']),
    reason: z.string().optional(),
    timestamp: z.string().datetime(),
});
export const CreditsInfoSchema = z.object({
    userId: uuidSchema,
    balance: z.number().nonnegative(),
    lastUpdated: z.string().datetime(),
    history: z.array(CreditTransactionSchema).optional(),
});
export const UpdateUserProfileRequestSchema = z.object({
    displayName: z.string().max(255).optional(),
    email: emailSchema.optional(),
});
export const UpdateUserPreferencesRequestSchema = z.object({
    theme: themeSchema.optional(),
    language: z.string().optional(),
    notifications: z.boolean().optional(),
    chatPreferences: z
        .object({
        length: lengthSchema.optional(),
        style: styleSchema.optional(),
    })
        .optional(),
    customPreferences: z.record(z.unknown()).optional(),
});
export const PurchaseCreditsRequestSchema = z.object({
    amount: z.number().positive('Amount must be greater than 0'),
    paymentMethodId: z.string().optional(),
});
export const UserProfileSchema = z.object({
    id: uuidSchema,
    email: emailSchema,
    displayName: z.string().nullable(),
    chatName: z.string().nullable(),
    personalityMode: personalityModeSchema.nullable(),
    isAdmin: z.boolean(),
    credits: z.number().nonnegative(),
    subscriptionStatus: z.enum(['subscribed', 'not_subscribed']),
    stripeCustomerId: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
