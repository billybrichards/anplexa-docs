"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUncachableStripeClient = getUncachableStripeClient;
exports.getStripeClient = getStripeClient;
exports.getStripePublishableKey = getStripePublishableKey;
exports.getStripeSecretKey = getStripeSecretKey;
exports.clearStripeCache = clearStripeCache;
const stripe_1 = __importDefault(require("stripe"));
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
function getUncachableStripeClient() {
    const { secretKey } = getCredentials();
    return new stripe_1.default(secretKey, {
        apiVersion: '2023-10-16',
    });
}
/**
 * Get cached Stripe client instance
 */
function getStripeClient() {
    if (!cachedStripeClient) {
        const { secretKey } = getCredentials();
        cachedStripeClient = new stripe_1.default(secretKey, {
            apiVersion: '2023-10-16',
        });
    }
    return cachedStripeClient;
}
/**
 * Get Stripe publishable key
 */
function getStripePublishableKey() {
    const { publishableKey } = getCredentials();
    return publishableKey;
}
/**
 * Get Stripe secret key
 */
function getStripeSecretKey() {
    const { secretKey } = getCredentials();
    return secretKey;
}
/**
 * Clear cached credentials and client (useful for testing)
 */
function clearStripeCache() {
    cachedCredentials = null;
    cachedStripeClient = null;
}
