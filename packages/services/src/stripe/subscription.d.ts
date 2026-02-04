import Stripe from 'stripe';
/**
 * Create a Stripe customer
 */
export declare function createCustomer(email: string, options?: {
    name?: string;
    description?: string;
    metadata?: Record<string, string>;
    userId?: string;
}): Promise<Stripe.Customer>;
/**
 * Get a Stripe customer by ID
 */
export declare function getCustomer(customerId: string): Promise<Stripe.Customer>;
/**
 * Update a Stripe customer
 */
export declare function updateCustomer(customerId: string, options: Stripe.CustomerUpdateParams): Promise<Stripe.Customer>;
/**
 * Delete a Stripe customer
 */
export declare function deleteCustomer(customerId: string): Promise<Stripe.DeletedCustomer>;
/**
 * Get a subscription by ID
 */
export declare function getSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
/**
 * List subscriptions for a customer
 */
export declare function listCustomerSubscriptions(customerId: string, options?: {
    limit?: number;
    startingAfter?: string;
    status?: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'all';
}): Promise<Stripe.ApiList<Stripe.Subscription>>;
/**
 * Update a subscription
 */
export declare function updateSubscription(subscriptionId: string, options: Stripe.SubscriptionUpdateParams): Promise<Stripe.Subscription>;
/**
 * Cancel a subscription immediately
 */
export declare function cancelSubscription(subscriptionId: string, options?: {
    invoiceNow?: boolean;
    prorate?: boolean;
}): Promise<Stripe.Subscription>;
/**
 * Schedule a subscription cancellation at period end
 */
export declare function scheduleSubscriptionCancellation(subscriptionId: string): Promise<Stripe.Subscription>;
/**
 * Unschedule a subscription cancellation
 */
export declare function unscheduleSubscriptionCancellation(subscriptionId: string): Promise<Stripe.Subscription>;
/**
 * Change subscription price/plan
 */
export declare function changeSubscriptionPrice(subscriptionId: string, newPriceId: string, options?: {
    billingCycleAnchor?: 'now' | 'automatic';
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}): Promise<Stripe.Subscription>;
/**
 * Create a billing portal session for customer subscription management
 */
export declare function createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session>;
/**
 * Retrieve a product by ID
 */
export declare function getProduct(productId: string): Promise<Stripe.Product>;
/**
 * List products
 */
export declare function listProducts(options?: {
    active?: boolean;
    limit?: number;
    startingAfter?: string;
}): Promise<Stripe.ApiList<Stripe.Product>>;
/**
 * Get a price by ID
 */
export declare function getPrice(priceId: string): Promise<Stripe.Price>;
/**
 * List prices for a product
 */
export declare function listPricesForProduct(productId: string, options?: {
    active?: boolean;
    limit?: number;
    startingAfter?: string;
}): Promise<Stripe.ApiList<Stripe.Price>>;
/**
 * List all prices
 */
export declare function listPrices(options?: {
    active?: boolean;
    limit?: number;
    startingAfter?: string;
}): Promise<Stripe.ApiList<Stripe.Price>>;
//# sourceMappingURL=subscription.d.ts.map