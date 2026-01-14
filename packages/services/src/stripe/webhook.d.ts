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
export declare function constructWebhookEvent(payload: Buffer | string, signature: string): Stripe.Event;
/**
 * Process a Stripe webhook with signature verification
 */
export declare function processWebhook(payload: Buffer | string, signature: string): Stripe.Event;
/**
 * Handle checkout.session.completed event
 */
export declare function handleCheckoutCompleted(session: Stripe.Checkout.Session): {
    customerId: string;
    subscriptionId: string | null;
    email: string | null;
    metadata: Record<string, string> | null;
};
/**
 * Handle customer.subscription.created event
 */
export declare function handleSubscriptionCreated(subscription: Stripe.Subscription): {
    customerId: string;
    subscriptionId: string;
    status: string;
    isActive: boolean;
    startDate: Date;
    currentPeriodEnd: Date;
    metadata: Record<string, string> | null;
};
/**
 * Handle customer.subscription.updated event
 */
export declare function handleSubscriptionUpdated(subscription: Stripe.Subscription): {
    customerId: string;
    subscriptionId: string;
    status: string;
    isActive: boolean;
    isCanceled: boolean;
    canceledAt: Date | null;
    metadata: Record<string, string> | null;
};
/**
 * Handle customer.subscription.deleted event
 */
export declare function handleSubscriptionDeleted(subscription: Stripe.Subscription): {
    customerId: string;
    subscriptionId: string;
    canceledAt: Date | null;
    metadata: Record<string, string> | null;
};
/**
 * Handle invoice.paid event
 */
export declare function handleInvoicePaid(invoice: Stripe.Invoice): {
    customerId: string;
    subscriptionId: string | null;
    invoiceId: string;
    amountPaid: number;
    currency: string;
    paidAt: Date;
    metadata: Record<string, string> | null;
};
/**
 * Handle invoice.payment_failed event
 */
export declare function handleInvoicePaymentFailed(invoice: Stripe.Invoice): {
    customerId: string;
    subscriptionId: string | null;
    invoiceId: string;
    amountDue: number;
    currency: string;
    nextPaymentAttempt: Date | null;
    metadata: Record<string, string> | null;
};
/**
 * Determine if a subscription is considered "active"
 */
export declare function isSubscriptionActive(status: string): boolean;
/**
 * Determine if a subscription is considered "canceled" or "in trouble"
 */
export declare function isSubscriptionCanceled(status: string): boolean;
//# sourceMappingURL=webhook.d.ts.map