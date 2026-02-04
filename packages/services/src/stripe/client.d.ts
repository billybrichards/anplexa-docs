import Stripe from 'stripe';
/**
 * Get a fresh Stripe client instance (not cached)
 */
export declare function getUncachableStripeClient(): Stripe;
/**
 * Get cached Stripe client instance
 */
export declare function getStripeClient(): Stripe;
/**
 * Get Stripe publishable key
 */
export declare function getStripePublishableKey(): string;
/**
 * Get Stripe secret key
 */
export declare function getStripeSecretKey(): string;
/**
 * Clear cached credentials and client (useful for testing)
 */
export declare function clearStripeCache(): void;
/**
 * Alias for clearStripeCache (for backwards compatibility)
 */
export declare const clearCache: typeof clearStripeCache;
//# sourceMappingURL=client.d.ts.map