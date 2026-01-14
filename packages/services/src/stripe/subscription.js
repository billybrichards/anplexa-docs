"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomer = createCustomer;
exports.getCustomer = getCustomer;
exports.updateCustomer = updateCustomer;
exports.deleteCustomer = deleteCustomer;
exports.getSubscription = getSubscription;
exports.listCustomerSubscriptions = listCustomerSubscriptions;
exports.updateSubscription = updateSubscription;
exports.cancelSubscription = cancelSubscription;
exports.scheduleSubscriptionCancellation = scheduleSubscriptionCancellation;
exports.unscheduleSubscriptionCancellation = unscheduleSubscriptionCancellation;
exports.changeSubscriptionPrice = changeSubscriptionPrice;
exports.createBillingPortalSession = createBillingPortalSession;
exports.getProduct = getProduct;
exports.listProducts = listProducts;
exports.getPrice = getPrice;
exports.listPricesForProduct = listPricesForProduct;
exports.listPrices = listPrices;
const client_js_1 = require("./client.js");
/**
 * Create a Stripe customer
 */
async function createCustomer(email, options) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    const metadata = options?.metadata || {};
    if (options?.userId) {
        metadata.userId = options.userId;
    }
    return await stripe.customers.create({
        email,
        name: options?.name,
        description: options?.description,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });
}
/**
 * Get a Stripe customer by ID
 */
async function getCustomer(customerId) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.customers.retrieve(customerId);
}
/**
 * Update a Stripe customer
 */
async function updateCustomer(customerId, options) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.customers.update(customerId, options);
}
/**
 * Delete a Stripe customer
 */
async function deleteCustomer(customerId) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.customers.del(customerId);
}
/**
 * Get a subscription by ID
 */
async function getSubscription(subscriptionId) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.subscriptions.retrieve(subscriptionId);
}
/**
 * List subscriptions for a customer
 */
async function listCustomerSubscriptions(customerId, options) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.subscriptions.list({
        customer: customerId,
        limit: options?.limit,
        starting_after: options?.startingAfter,
        status: options?.status,
    });
}
/**
 * Update a subscription
 */
async function updateSubscription(subscriptionId, options) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.subscriptions.update(subscriptionId, options);
}
/**
 * Cancel a subscription immediately
 */
async function cancelSubscription(subscriptionId, options) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.subscriptions.cancel(subscriptionId, {
        invoice_now: options?.invoiceNow,
        prorate: options?.prorate,
    });
}
/**
 * Schedule a subscription cancellation at period end
 */
async function scheduleSubscriptionCancellation(subscriptionId) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
    });
}
/**
 * Unschedule a subscription cancellation
 */
async function unscheduleSubscriptionCancellation(subscriptionId) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
    });
}
/**
 * Change subscription price/plan
 */
async function changeSubscriptionPrice(subscriptionId, newPriceId, options) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!subscription.items.data[0]) {
        throw new Error('Subscription has no items');
    }
    return await stripe.subscriptions.update(subscriptionId, {
        items: [
            {
                id: subscription.items.data[0].id,
                price: newPriceId,
            },
        ],
        billing_cycle_anchor: options?.billingCycleAnchor,
        proration_behavior: options?.prorationBehavior,
    });
}
/**
 * Create a billing portal session for customer subscription management
 */
async function createBillingPortalSession(customerId, returnUrl) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
}
/**
 * Retrieve a product by ID
 */
async function getProduct(productId) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.products.retrieve(productId);
}
/**
 * List products
 */
async function listProducts(options) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.products.list({
        active: options?.active,
        limit: options?.limit,
        starting_after: options?.startingAfter,
    });
}
/**
 * Get a price by ID
 */
async function getPrice(priceId) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.prices.retrieve(priceId);
}
/**
 * List prices for a product
 */
async function listPricesForProduct(productId, options) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.prices.list({
        product: productId,
        active: options?.active,
        limit: options?.limit,
        starting_after: options?.startingAfter,
    });
}
/**
 * List all prices
 */
async function listPrices(options) {
    const stripe = (0, client_js_1.getUncachableStripeClient)();
    return await stripe.prices.list({
        active: options?.active,
        limit: options?.limit,
        starting_after: options?.startingAfter,
    });
}
