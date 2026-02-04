import { getUncachableStripeClient } from './client';
import Stripe from 'stripe';

export interface StripeWebhookEvent {
  id: string;
  object: string;
  type: string;
  data: {
    object: any;
    previous_attributes?: any;
  };
}

/**
 * Verify and construct a Stripe webhook event
 */
export function constructWebhookEvent(
  payload: Buffer | string,
  signature: string
): Stripe.Event {
  if (typeof payload === 'string') {
    payload = Buffer.from(payload);
  }

  if (!Buffer.isBuffer(payload)) {
    throw new Error(
      'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
      'Received type: ' + typeof payload + '. ' +
      'This usually means express.json() parsed the body before reaching this handler. ' +
      'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
    );
  }

  const stripe = getUncachableStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Process a Stripe webhook with signature verification
 */
export function processWebhook(payload: Buffer | string, signature: string): Stripe.Event {
  const event = constructWebhookEvent(payload, signature);
  console.log(`Processing Stripe webhook event: ${event.type}`);
  return event;
}

/**
 * Handle checkout.session.completed event
 */
export function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): {
  customerId: string;
  subscriptionId: string | null;
  email: string | null;
  metadata: Record<string, string> | null;
} {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string | null;
  const email = session.customer_details?.email || null;
  const metadata = session.metadata;

  if (!customerId) {
    throw new Error('No customer ID in checkout session');
  }

  return {
    customerId,
    subscriptionId,
    email,
    metadata: metadata || null,
  };
}

/**
 * Handle customer.subscription.created event
 */
export function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): {
  customerId: string;
  subscriptionId: string;
  status: string;
  isActive: boolean;
  startDate: Date;
  currentPeriodEnd: Date;
  metadata: Record<string, string> | null;
} {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const isActive = ['active', 'trialing'].includes(status);

  if (!customerId) {
    throw new Error('No customer ID in subscription created event');
  }

  return {
    customerId,
    subscriptionId,
    status,
    isActive,
    startDate: new Date(subscription.start_date * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    metadata: subscription.metadata,
  };
}

/**
 * Handle customer.subscription.updated event
 */
export function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): {
  customerId: string;
  subscriptionId: string;
  status: string;
  isActive: boolean;
  isCanceled: boolean;
  canceledAt: Date | null;
  metadata: Record<string, string> | null;
} {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const isActive = ['active', 'trialing'].includes(status);
  const isCanceled = ['canceled', 'unpaid', 'past_due'].includes(status);
  const canceledAt = subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null;

  if (!customerId) {
    throw new Error('No customer ID in subscription updated event');
  }

  return {
    customerId,
    subscriptionId,
    status,
    isActive,
    isCanceled,
    canceledAt,
    metadata: subscription.metadata,
  };
}

/**
 * Handle customer.subscription.deleted event
 */
export function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): {
  customerId: string;
  subscriptionId: string;
  canceledAt: Date | null;
  metadata: Record<string, string> | null;
} {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const canceledAt = subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null;

  if (!customerId) {
    throw new Error('No customer ID in subscription deleted event');
  }

  return {
    customerId,
    subscriptionId,
    canceledAt,
    metadata: subscription.metadata,
  };
}

/**
 * Handle invoice.paid event
 */
export function handleInvoicePaid(
  invoice: Stripe.Invoice
): {
  customerId: string;
  subscriptionId: string | null;
  invoiceId: string;
  amountPaid: number;
  currency: string;
  paidAt: Date;
  metadata: Record<string, string> | null;
} {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string | null;
  const invoiceId = invoice.id;
  const amountPaid = invoice.amount_paid;
  const currency = invoice.currency;
  const paidAt = invoice.status_transitions?.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000)
    : new Date();

  if (!customerId) {
    throw new Error('No customer ID in invoice paid event');
  }

  return {
    customerId,
    subscriptionId,
    invoiceId,
    amountPaid,
    currency,
    paidAt,
    metadata: invoice.metadata,
  };
}

/**
 * Handle invoice.payment_failed event
 */
export function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): {
  customerId: string;
  subscriptionId: string | null;
  invoiceId: string;
  amountDue: number;
  currency: string;
  nextPaymentAttempt: Date | null;
  metadata: Record<string, string> | null;
} {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string | null;
  const invoiceId = invoice.id;
  const amountDue = invoice.amount_due;
  const currency = invoice.currency;
  const nextPaymentAttempt = invoice.next_payment_attempt
    ? new Date(invoice.next_payment_attempt * 1000)
    : null;

  if (!customerId) {
    throw new Error('No customer ID in invoice payment failed event');
  }

  return {
    customerId,
    subscriptionId,
    invoiceId,
    amountDue,
    currency,
    nextPaymentAttempt,
    metadata: invoice.metadata,
  };
}

/**
 * Determine if a subscription is considered "active"
 */
export function isSubscriptionActive(status: string): boolean {
  return ['active', 'trialing'].includes(status);
}

/**
 * Determine if a subscription is considered "canceled" or "in trouble"
 */
export function isSubscriptionCanceled(status: string): boolean {
  return ['canceled', 'unpaid', 'past_due'].includes(status);
}
