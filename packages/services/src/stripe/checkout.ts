import { getUncachableStripeClient } from './client';
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
export async function createCheckoutSession(
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  options: CheckoutSessionOptions = {}
): Promise<Stripe.Checkout.Session> {
  const stripe = getUncachableStripeClient();

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
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
  } else if (options.customerEmail) {
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
  } else if (options.metadata) {
    sessionConfig.metadata = options.metadata;
  }

  return await stripe.checkout.sessions.create(sessionConfig);
}

/**
 * Create a Stripe checkout session for one-time payment
 */
export async function createOneTimeCheckoutSession(
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  options: CheckoutSessionOptions = {}
): Promise<Stripe.Checkout.Session> {
  const stripe = getUncachableStripeClient();

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
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
  } else if (options.customerEmail) {
    sessionConfig.customer_email = options.customerEmail;
  }

  // Add metadata and client reference ID
  if (options.userId) {
    sessionConfig.client_reference_id = options.userId;
    sessionConfig.metadata = {
      userId: options.userId,
      ...(options.metadata || {}),
    };
  } else if (options.metadata) {
    sessionConfig.metadata = options.metadata;
  }

  return await stripe.checkout.sessions.create(sessionConfig);
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = getUncachableStripeClient();
  return await stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * List checkout sessions with optional filtering
 */
export async function listCheckoutSessions(
  limit: number = 10,
  startingAfter?: string
): Promise<Stripe.ApiList<Stripe.Checkout.Session>> {
  const stripe = getUncachableStripeClient();
  return await stripe.checkout.sessions.list({
    limit,
    starting_after: startingAfter,
  });
}

/**
 * Expire a checkout session
 */
export async function expireCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = getUncachableStripeClient();
  return await stripe.checkout.sessions.expire(sessionId);
}
