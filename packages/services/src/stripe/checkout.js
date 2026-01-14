"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = createCheckoutSession;
exports.createOneTimeCheckoutSession = createOneTimeCheckoutSession;
exports.getCheckoutSession = getCheckoutSession;
exports.listCheckoutSessions = listCheckoutSessions;
exports.expireCheckoutSession = expireCheckoutSession;
const client_js_1 = require("./client.js");
/**
 * Create a Stripe checkout session for a subscription
 */
async function createCheckoutSession(priceId, successUrl, cancelUrl, options = {}) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    const sessionConfig = {
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        billing_address_collection: options.billingAddressCollection || 'auto',
    };
    // Add customer or email if provided
    if (options.customerId) {
        sessionConfig.customer = options.customerId;
    }
    else if (options.customerEmail) {
        sessionConfig.customer_email = options.customerEmail;
        sessionConfig.customer_creation = options.customerCreation || 'if_required';
    }
    // Add metadata and client reference ID
    if (options.userId) {
        sessionConfig.client_reference_id = options.userId;
        sessionConfig.metadata = {
            userId: options.userId,
            ...(options.metadata || {}),
        };
    }
    else if (options.metadata) {
        sessionConfig.metadata = options.metadata;
    }
    return await stripe.checkout.sessions.create(sessionConfig);
}
/**
 * Create a Stripe checkout session for one-time payment
 */
async function createOneTimeCheckoutSession(priceId, successUrl, cancelUrl, options = {}) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    const sessionConfig = {
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
    };
    // Add customer or email if provided
    if (options.customerId) {
        sessionConfig.customer = options.customerId;
    }
    else if (options.customerEmail) {
        sessionConfig.customer_email = options.customerEmail;
    }
    // Add metadata and client reference ID
    if (options.userId) {
        sessionConfig.client_reference_id = options.userId;
        sessionConfig.metadata = {
            userId: options.userId,
            ...(options.metadata || {}),
        };
    }
    else if (options.metadata) {
        sessionConfig.metadata = options.metadata;
    }
    return await stripe.checkout.sessions.create(sessionConfig);
}
/**
 * Retrieve a checkout session by ID
 */
async function getCheckoutSession(sessionId) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.checkout.sessions.retrieve(sessionId);
}
/**
 * List checkout sessions with optional filtering
 */
async function listCheckoutSessions(limit = 10, startingAfter) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.checkout.sessions.list({
        limit,
        starting_after: startingAfter,
    });
}
/**
 * Expire a checkout session
 */
async function expireCheckoutSession(sessionId) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.checkout.sessions.expire(sessionId);
}
