import { getUncachableStripeClient } from './client';
import Stripe from 'stripe';

/**
 * Create a Stripe customer
 */
export async function createCustomer(
  email: string,
  options?: {
    name?: string;
    description?: string;
    metadata?: Record<string, string>;
    userId?: string;
  }
): Promise<Stripe.Customer> {
  const stripe = getUncachableStripeClient();

  const metadata: Record<string, string> = options?.metadata || {};
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
export async function getCustomer(customerId: string): Promise<Stripe.Customer> {
  const stripe = getUncachableStripeClient();
  return await stripe.customers.retrieve(customerId) as Stripe.Customer;
}

/**
 * Update a Stripe customer
 */
export async function updateCustomer(
  customerId: string,
  options: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  const stripe = getUncachableStripeClient();
  return await stripe.customers.update(customerId, options) as Stripe.Customer;
}

/**
 * Delete a Stripe customer
 */
export async function deleteCustomer(customerId: string): Promise<Stripe.DeletedCustomer> {
  const stripe = getUncachableStripeClient();
  return await stripe.customers.del(customerId);
}

/**
 * Get a subscription by ID
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getUncachableStripeClient();
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * List subscriptions for a customer
 */
export async function listCustomerSubscriptions(
  customerId: string,
  options?: {
    limit?: number;
    startingAfter?: string;
    status?: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'all';
  }
): Promise<Stripe.ApiList<Stripe.Subscription>> {
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
export async function updateSubscription(
  subscriptionId: string,
  options: Stripe.SubscriptionUpdateParams
): Promise<Stripe.Subscription> {
  const stripe = getUncachableStripeClient();
  return await stripe.subscriptions.update(subscriptionId, options);
}

/**
 * Cancel a subscription immediately
 */
export async function cancelSubscription(
  subscriptionId: string,
  options?: {
    invoiceNow?: boolean;
    prorate?: boolean;
  }
): Promise<Stripe.Subscription> {
  const stripe = getUncachableStripeClient();

  return await stripe.subscriptions.cancel(subscriptionId, {
    invoice_now: options?.invoiceNow,
    prorate: options?.prorate,
  });
}

/**
 * Schedule a subscription cancellation at period end
 */
export async function scheduleSubscriptionCancellation(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getUncachableStripeClient();

  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Unschedule a subscription cancellation
 */
export async function unscheduleSubscriptionCancellation(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getUncachableStripeClient();

  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Change subscription price/plan
 */
export async function changeSubscriptionPrice(
  subscriptionId: string,
  newPriceId: string,
  options?: {
    billingCycleAnchor?: 'now' | 'automatic';
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  }
): Promise<Stripe.Subscription> {
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
    billing_cycle_anchor: options?.billingCycleAnchor as any,
    proration_behavior: options?.prorationBehavior as any,
  });
}

/**
 * Create a billing portal session for customer subscription management
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getUncachableStripeClient();

  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Retrieve a product by ID
 */
export async function getProduct(productId: string): Promise<Stripe.Product> {
  const stripe = getUncachableStripeClient();
  return await stripe.products.retrieve(productId);
}

/**
 * List products
 */
export async function listProducts(
  options?: {
    active?: boolean;
    limit?: number;
    startingAfter?: string;
  }
): Promise<Stripe.ApiList<Stripe.Product>> {
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
export async function getPrice(priceId: string): Promise<Stripe.Price> {
  const stripe = getUncachableStripeClient();
  return await stripe.prices.retrieve(priceId);
}

/**
 * List prices for a product
 */
export async function listPricesForProduct(
  productId: string,
  options?: {
    active?: boolean;
    limit?: number;
    startingAfter?: string;
  }
): Promise<Stripe.ApiList<Stripe.Price>> {
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
export async function listPrices(
  options?: {
    active?: boolean;
    limit?: number;
    startingAfter?: string;
  }
): Promise<Stripe.ApiList<Stripe.Price>> {
  const stripe = getUncachableStripeClient();

  return await stripe.prices.list({
    active: options?.active,
    limit: options?.limit,
    starting_after: options?.startingAfter,
  });
}
