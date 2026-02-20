import Stripe from 'stripe';
export interface CheckoutSessionOptions {
    customerId?: string;
    customerEmail?: string;
    customerCreation?: 'always' | 'if_required';
    billingAddressCollection?: 'auto' | 'required';
    userId?: string;
    metadata?: Record<string, string>;
}
/**
 * Create a Stripe checkout session for a subscription
 */
export declare function createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string, options?: CheckoutSessionOptions): Promise<Stripe.Checkout.Session>;
/**
 * Create a Stripe checkout session for one-time payment
 */
export declare function createOneTimeCheckoutSession(priceId: string, successUrl: string, cancelUrl: string, options?: CheckoutSessionOptions): Promise<Stripe.Checkout.Session>;
/**
 * Retrieve a checkout session by ID
 */
export declare function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session>;
/**
 * List checkout sessions with optional filtering
 */
export declare function listCheckoutSessions(limit?: number, startingAfter?: string): Promise<Stripe.ApiList<Stripe.Checkout.Session>>;
/**
 * Expire a checkout session
 */
export declare function expireCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session>;
//# sourceMappingURL=checkout.d.ts.map