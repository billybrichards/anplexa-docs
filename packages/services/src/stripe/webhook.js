/* global Buffer, process, console */
import { getUncachableStripeClient } from './client';
/**
 * Verify and construct a Stripe webhook event
 */
export function constructWebhookEvent(payload, signature) {
    if (typeof payload === 'string') {
        payload = Buffer.from(payload);
    }
    if (!Buffer.isBuffer(payload)) {
        throw new Error('STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
            'Received type: ' + typeof payload + '. ' +
            'This usually means express.json() parsed the body before reaching this handler. ' +
            'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).');
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
export function processWebhook(payload, signature) {
    const event = constructWebhookEvent(payload, signature);
    console.log(`Processing Stripe webhook event: ${event.type}`);
    return event;
}
/**
 * Handle checkout.session.completed event
 */
export function handleCheckoutCompleted(session) {
    const customerId = session.customer;
    const subscriptionId = session.subscription;
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
export function handleSubscriptionCreated(subscription) {
    const customerId = subscription.customer;
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
export function handleSubscriptionUpdated(subscription) {
    const customerId = subscription.customer;
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
export function handleSubscriptionDeleted(subscription) {
    const customerId = subscription.customer;
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
export function handleInvoicePaid(invoice) {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
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
export function handleInvoicePaymentFailed(invoice) {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
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
export function isSubscriptionActive(status) {
    return ['active', 'trialing'].includes(status);
}
/**
 * Determine if a subscription is considered "canceled" or "in trouble"
 */
export function isSubscriptionCanceled(status) {
    return ['canceled', 'unpaid', 'past_due'].includes(status);
}
