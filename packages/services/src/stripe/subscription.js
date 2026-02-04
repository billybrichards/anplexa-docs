import { getUncachableStripeClient } from './client';
/**
 * Create a Stripe customer
 */
export async function createCustomer(email, options) {
    const stripe = getUncachableStripeClient();
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
export async function getCustomer(customerId) {
    const stripe = getUncachableStripeClient();
    return await stripe.customers.retrieve(customerId);
}
/**
 * Update a Stripe customer
 */
export async function updateCustomer(customerId, options) {
    const stripe = getUncachableStripeClient();
    return await stripe.customers.update(customerId, options);
}
/**
 * Delete a Stripe customer
 */
export async function deleteCustomer(customerId) {
    const stripe = getUncachableStripeClient();
    return await stripe.customers.del(customerId);
}
/**
 * Get a subscription by ID
 */
export async function getSubscription(subscriptionId) {
    const stripe = getUncachableStripeClient();
    return await stripe.subscriptions.retrieve(subscriptionId);
}
/**
 * List subscriptions for a customer
 */
export async function listCustomerSubscriptions(customerId, options) {
    const stripe = getUncachableStripeClient();
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
export async function updateSubscription(subscriptionId, options) {
    const stripe = getUncachableStripeClient();
    return await stripe.subscriptions.update(subscriptionId, options);
}
/**
 * Cancel a subscription immediately
 */
export async function cancelSubscription(subscriptionId, options) {
    const stripe = getUncachableStripeClient();
    return await stripe.subscriptions.cancel(subscriptionId, {
        invoice_now: options?.invoiceNow,
        prorate: options?.prorate,
    });
}
/**
 * Schedule a subscription cancellation at period end
 */
export async function scheduleSubscriptionCancellation(subscriptionId) {
    const stripe = getUncachableStripeClient();
    return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
    });
}
/**
 * Unschedule a subscription cancellation
 */
export async function unscheduleSubscriptionCancellation(subscriptionId) {
    const stripe = getUncachableStripeClient();
    return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
    });
}
/**
 * Change subscription price/plan
 */
export async function changeSubscriptionPrice(subscriptionId, newPriceId, options) {
    const stripe = getUncachableStripeClient();
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
export async function createBillingPortalSession(customerId, returnUrl) {
    const stripe = getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
}
/**
 * Retrieve a product by ID
 */
export async function getProduct(productId) {
    const stripe = getUncachableStripeClient();
    return await stripe.products.retrieve(productId);
}
/**
 * List products
 */
export async function listProducts(options) {
    const stripe = getUncachableStripeClient();
    return await stripe.products.list({
        active: options?.active,
        limit: options?.limit,
        starting_after: options?.startingAfter,
    });
}
/**
 * Get a price by ID
 */
export async function getPrice(priceId) {
    const stripe = getUncachableStripeClient();
    return await stripe.prices.retrieve(priceId);
}
/**
 * List prices for a product
 */
export async function listPricesForProduct(productId, options) {
    const stripe = getUncachableStripeClient();
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
export async function listPrices(options) {
    const stripe = getUncachableStripeClient();
    return await stripe.prices.list({
        active: options?.active,
        limit: options?.limit,
        starting_after: options?.startingAfter,
    });
}
