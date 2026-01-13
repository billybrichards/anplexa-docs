/**
 * Stripe API Contracts
 *
 * Shared type definitions for payment/subscription endpoints.
 * Includes request types, response types, webhook payloads, and Zod validation schemas.
 */

import { z } from 'zod';

// ============================================================================
// Request Types
// ============================================================================

export interface CreateCheckoutRequest {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface PublishableKeyResponse {
  publishableKey: string;
}

export interface PriceDTO {
  id: string;
  unitAmount: number;
  currency: string;
  interval: 'month' | 'year' | 'week' | 'day';
  intervalCount: number;
}

export interface ProductDTO {
  id: string;
  name: string;
  description: string | null;
  prices: PriceDTO[];
}

export interface ProductListResponse {
  products: ProductDTO[];
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface SubscriptionWebhookPayload {
  userId: string;
  subscriptionStatus: 'subscribed' | 'not_subscribed';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface CreditsWebhookPayload {
  userId: string;
  credits: number;
  operation: 'set' | 'add' | 'subtract';
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
    previous_attributes?: Record<string, unknown>;
  };
  created: number;
  object: string;
  api_version: string;
  account: string;
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
}

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

// ============================================================================
// Type Inference from Zod Schemas
// ============================================================================

export type ValidatedCreateCheckoutRequest = z.infer<typeof CreateCheckoutRequestSchema>;
export type ValidatedSubscriptionWebhookPayload = z.infer<typeof SubscriptionWebhookPayloadSchema>;
export type ValidatedCreditsWebhookPayload = z.infer<typeof CreditsWebhookPayloadSchema>;
