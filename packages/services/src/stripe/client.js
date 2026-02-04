import Stripe from 'stripe';
let cachedStripeClient = null;
let cachedCredentials = null;
/**
 * Get Stripe credentials from environment variables
 */
function getCredentials() {
    if (cachedCredentials) {
        return cachedCredentials;
    }
    const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
    const stripePublic = process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLIC;
    if (!stripeSecret || !stripePublic) {
        throw new Error('Stripe credentials not found. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY environment variables.');
    }
    cachedCredentials = {
        publishableKey: stripePublic,
        secretKey: stripeSecret,
    };
    return cachedCredentials;
}
/**
 * Get a fresh Stripe client instance (not cached)
 */
export function getUncachableStripeClient() {
    const { secretKey } = getCredentials();
    return new Stripe(secretKey, {
        apiVersion: '2023-10-16',
    });
}
/**
 * Get cached Stripe client instance
 */
export function getStripeClient() {
    if (!cachedStripeClient) {
        const { secretKey } = getCredentials();
        cachedStripeClient = new Stripe(secretKey, {
            apiVersion: '2023-10-16',
        });
    }
    return cachedStripeClient;
}
/**
 * Get Stripe publishable key
 */
export function getStripePublishableKey() {
    const { publishableKey } = getCredentials();
    return publishableKey;
}
/**
 * Get Stripe secret key
 */
export function getStripeSecretKey() {
    const { secretKey } = getCredentials();
    return secretKey;
}
/**
 * Clear cached credentials and client (useful for testing)
 */
export function clearStripeCache() {
    cachedCredentials = null;
    cachedStripeClient = null;
}
/**
 * Alias for clearStripeCache (for backwards compatibility)
 */
export const clearCache = clearStripeCache;
