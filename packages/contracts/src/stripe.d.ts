/**
 * Stripe API Contracts
 *
 * Shared type definitions for payment/subscription endpoints.
 * Includes request types, response types, webhook payloads, and Zod validation schemas.
 */
import { z } from 'zod';
export interface CreateCheckoutRequest {
    priceId: string;
    successUrl?: string;
    cancelUrl?: string;
}
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
export declare const CreateCheckoutRequestSchema: z.ZodObject<{
    priceId: z.ZodString;
    successUrl: z.ZodOptional<z.ZodString>;
    cancelUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    priceId: string;
    successUrl?: string | undefined;
    cancelUrl?: string | undefined;
}, {
    priceId: string;
    successUrl?: string | undefined;
    cancelUrl?: string | undefined;
}>;
export declare const PriceDTOSchema: z.ZodObject<{
    id: z.ZodString;
    unitAmount: z.ZodNumber;
    currency: z.ZodString;
    interval: z.ZodEnum<["month", "year", "week", "day"]>;
    intervalCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    unitAmount: number;
    currency: string;
    interval: "month" | "year" | "week" | "day";
    intervalCount: number;
}, {
    id: string;
    unitAmount: number;
    currency: string;
    interval: "month" | "year" | "week" | "day";
    intervalCount: number;
}>;
export declare const ProductDTOSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    prices: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        unitAmount: z.ZodNumber;
        currency: z.ZodString;
        interval: z.ZodEnum<["month", "year", "week", "day"]>;
        intervalCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        unitAmount: number;
        currency: string;
        interval: "month" | "year" | "week" | "day";
        intervalCount: number;
    }, {
        id: string;
        unitAmount: number;
        currency: string;
        interval: "month" | "year" | "week" | "day";
        intervalCount: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string | null;
    prices: {
        id: string;
        unitAmount: number;
        currency: string;
        interval: "month" | "year" | "week" | "day";
        intervalCount: number;
    }[];
}, {
    id: string;
    name: string;
    description: string | null;
    prices: {
        id: string;
        unitAmount: number;
        currency: string;
        interval: "month" | "year" | "week" | "day";
        intervalCount: number;
    }[];
}>;
export declare const SubscriptionWebhookPayloadSchema: z.ZodObject<{
    userId: z.ZodString;
    subscriptionStatus: z.ZodEnum<["subscribed", "not_subscribed"]>;
    stripeCustomerId: z.ZodOptional<z.ZodString>;
    stripeSubscriptionId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    subscriptionStatus: "not_subscribed" | "subscribed";
    userId: string;
    stripeCustomerId?: string | undefined;
    stripeSubscriptionId?: string | undefined;
}, {
    subscriptionStatus: "not_subscribed" | "subscribed";
    userId: string;
    stripeCustomerId?: string | undefined;
    stripeSubscriptionId?: string | undefined;
}>;
export declare const CreditsWebhookPayloadSchema: z.ZodObject<{
    userId: z.ZodString;
    credits: z.ZodNumber;
    operation: z.ZodEnum<["set", "add", "subtract"]>;
}, "strip", z.ZodTypeAny, {
    credits: number;
    userId: string;
    operation: "set" | "add" | "subtract";
}, {
    credits: number;
    userId: string;
    operation: "set" | "add" | "subtract";
}>;
export type ValidatedCreateCheckoutRequest = z.infer<typeof CreateCheckoutRequestSchema>;
export type ValidatedSubscriptionWebhookPayload = z.infer<typeof SubscriptionWebhookPayloadSchema>;
export type ValidatedCreditsWebhookPayload = z.infer<typeof CreditsWebhookPayloadSchema>;
//# sourceMappingURL=stripe.d.ts.map