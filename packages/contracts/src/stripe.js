/**
 * Stripe API Contracts
 *
 * Shared type definitions for payment/subscription endpoints.
 * Includes request types, response types, webhook payloads, and Zod validation schemas.
 */
import { z } from 'zod';
// ============================================================================
// Zod Validation Schemas
// ============================================================================
export const CreateCheckoutRequestSchema = z.object({
    priceId: z.string().min(1, 'Price ID is required'),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
});
export const PriceDTOSchema = z.object({
    id: z.string(),
    unitAmount: z.number().nonnegative(),
    currency: z.string().length(3).toLowerCase(),
    interval: z.enum(['month', 'year', 'week', 'day']),
    intervalCount: z.number().positive(),
});
export const ProductDTOSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    description: z.string().nullable(),
    prices: z.array(PriceDTOSchema),
});
export const SubscriptionWebhookPayloadSchema = z.object({
    userId: z.string().min(1),
    subscriptionStatus: z.enum(['subscribed', 'not_subscribed']),
    stripeCustomerId: z.string().optional(),
    stripeSubscriptionId: z.string().optional(),
});
export const CreditsWebhookPayloadSchema = z.object({
    userId: z.string().min(1),
    credits: z.number().nonnegative(),
    operation: z.enum(['set', 'add', 'subtract']),
});
