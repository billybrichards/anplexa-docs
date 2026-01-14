"use strict";
/**
 * Stripe API Contracts
 *
 * Shared type definitions for payment/subscription endpoints.
 * Includes request types, response types, webhook payloads, and Zod validation schemas.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditsWebhookPayloadSchema = exports.SubscriptionWebhookPayloadSchema = exports.ProductDTOSchema = exports.PriceDTOSchema = exports.CreateCheckoutRequestSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// Zod Validation Schemas
// ============================================================================
exports.CreateCheckoutRequestSchema = zod_1.z.object({
    priceId: zod_1.z.string().min(1, 'Price ID is required'),
    successUrl: zod_1.z.string().url().optional(),
    cancelUrl: zod_1.z.string().url().optional(),
});
exports.PriceDTOSchema = zod_1.z.object({
    id: zod_1.z.string(),
    unitAmount: zod_1.z.number().nonnegative(),
    currency: zod_1.z.string().length(3).toLowerCase(),
    interval: zod_1.z.enum(['month', 'year', 'week', 'day']),
    intervalCount: zod_1.z.number().positive(),
});
exports.ProductDTOSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().nullable(),
    prices: zod_1.z.array(exports.PriceDTOSchema),
});
exports.SubscriptionWebhookPayloadSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    subscriptionStatus: zod_1.z.enum(['subscribed', 'not_subscribed']),
    stripeCustomerId: zod_1.z.string().optional(),
    stripeSubscriptionId: zod_1.z.string().optional(),
});
exports.CreditsWebhookPayloadSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    credits: zod_1.z.number().nonnegative(),
    operation: zod_1.z.enum(['set', 'add', 'subtract']),
});
