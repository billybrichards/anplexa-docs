"use strict";
/**
 * User API Contracts
 *
 * Shared type definitions for user-related endpoints.
 * Includes user preferences, subscription status, and credits management.
 * Includes Zod validation schemas for request validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileSchema = exports.PurchaseCreditsRequestSchema = exports.UpdateUserPreferencesRequestSchema = exports.UpdateUserProfileRequestSchema = exports.CreditsInfoSchema = exports.CreditTransactionSchema = exports.SubscriptionInfoSchema = exports.UserPreferencesSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// Zod Validation Schemas
// ============================================================================
const uuidSchema = zod_1.z.string().uuid();
const emailSchema = zod_1.z.string().email('Invalid email address');
const themeSchema = zod_1.z.enum(['light', 'dark', 'system']);
const lengthSchema = zod_1.z.enum(['brief', 'moderate', 'detailed']);
const styleSchema = zod_1.z.enum(['casual', 'thoughtful', 'creative']);
const personalityModeSchema = zod_1.z.enum([
    'nurturing',
    'playful',
    'dominant',
    'filthy_sexy',
    'intimate_companion',
    'intellectual_muse',
]);
exports.UserPreferencesSchema = zod_1.z.object({
    userId: uuidSchema,
    theme: themeSchema.optional(),
    language: zod_1.z.string().optional(),
    notifications: zod_1.z.boolean().optional(),
    chatPreferences: zod_1.z
        .object({
        length: lengthSchema.optional(),
        style: styleSchema.optional(),
    })
        .optional(),
    customPreferences: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.SubscriptionInfoSchema = zod_1.z.object({
    userId: uuidSchema,
    status: zod_1.z.enum(['subscribed', 'not_subscribed', 'canceled', 'past_due']),
    stripeCustomerId: zod_1.z.string().nullable(),
    stripeSubscriptionId: zod_1.z.string().nullable(),
    currentPeriodStart: zod_1.z.string().datetime().optional(),
    currentPeriodEnd: zod_1.z.string().datetime().optional(),
    canceledAt: zod_1.z.string().datetime().optional(),
    cancelAtPeriodEnd: zod_1.z.boolean().optional(),
});
exports.CreditTransactionSchema = zod_1.z.object({
    id: uuidSchema,
    userId: uuidSchema,
    amount: zod_1.z.number(),
    operation: zod_1.z.enum(['set', 'add', 'subtract', 'purchase']),
    reason: zod_1.z.string().optional(),
    timestamp: zod_1.z.string().datetime(),
});
exports.CreditsInfoSchema = zod_1.z.object({
    userId: uuidSchema,
    balance: zod_1.z.number().nonnegative(),
    lastUpdated: zod_1.z.string().datetime(),
    history: zod_1.z.array(exports.CreditTransactionSchema).optional(),
});
exports.UpdateUserProfileRequestSchema = zod_1.z.object({
    displayName: zod_1.z.string().max(255).optional(),
    email: emailSchema.optional(),
});
exports.UpdateUserPreferencesRequestSchema = zod_1.z.object({
    theme: themeSchema.optional(),
    language: zod_1.z.string().optional(),
    notifications: zod_1.z.boolean().optional(),
    chatPreferences: zod_1.z
        .object({
        length: lengthSchema.optional(),
        style: styleSchema.optional(),
    })
        .optional(),
    customPreferences: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.PurchaseCreditsRequestSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Amount must be greater than 0'),
    paymentMethodId: zod_1.z.string().optional(),
});
exports.UserProfileSchema = zod_1.z.object({
    id: uuidSchema,
    email: emailSchema,
    displayName: zod_1.z.string().nullable(),
    chatName: zod_1.z.string().nullable(),
    personalityMode: personalityModeSchema.nullable(),
    isAdmin: zod_1.z.boolean(),
    credits: zod_1.z.number().nonnegative(),
    subscriptionStatus: zod_1.z.enum(['subscribed', 'not_subscribed']),
    stripeCustomerId: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
