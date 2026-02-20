/**
 * Stripe Service Interface
 *
 * Defines the contract for Stripe payment operations used by core use cases.
 * Uses generic types to avoid a direct dependency on the Stripe SDK in core.
 */

export interface CheckoutSessionOptions {
  customerId?: string;
  customerEmail?: string;
  customerCreation?: 'always' | 'if_required';
  billingAddressCollection?: 'auto' | 'required';
  userId?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  id: string;
  url: string | null;
}

export interface CustomerResult {
  id: string;
}

export interface SubscriptionResult {
  id: string;
  status: string;
  customer: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  metadata: Record<string, string> | null;
}

export interface CheckoutCompletedData {
  customerId: string;
  subscriptionId: string | null;
  email: string | null;
  metadata: Record<string, string> | null;
}

export interface SubscriptionEventData {
  customerId: string;
  subscriptionId: string;
  status: string;
  isActive: boolean;
  isCanceled?: boolean;
  canceledAt: Date | null;
  metadata: Record<string, string> | null;
}

export interface InvoiceEventData {
  customerId: string;
  subscriptionId: string | null;
  invoiceId: string;
  amountPaid?: number;
  amountDue?: number;
  currency: string;
  paidAt?: Date;
  nextPaymentAttempt?: Date | null;
  metadata: Record<string, string> | null;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export interface IStripeService {
  // Checkout
  createCheckoutSession(
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    options?: CheckoutSessionOptions,
  ): Promise<CheckoutSessionResult>;

  // Customer
  createCustomer(
    email: string,
    options?: {
      name?: string;
      description?: string;
      metadata?: Record<string, string>;
      userId?: string;
    },
  ): Promise<CustomerResult>;
  getCustomer(customerId: string): Promise<CustomerResult>;

  // Subscription
  getSubscription(subscriptionId: string): Promise<SubscriptionResult>;
  cancelSubscription(
    subscriptionId: string,
    options?: { invoiceNow?: boolean; prorate?: boolean },
  ): Promise<SubscriptionResult>;
  scheduleSubscriptionCancellation(subscriptionId: string): Promise<SubscriptionResult>;
  unscheduleSubscriptionCancellation(subscriptionId: string): Promise<SubscriptionResult>;
  changeSubscriptionPrice(
    subscriptionId: string,
    newPriceId: string,
    options?: {
      prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
    },
  ): Promise<SubscriptionResult>;

  // Webhook
  constructWebhookEvent(payload: Buffer | string, signature: string): WebhookEvent;
  handleCheckoutCompleted(session: any): CheckoutCompletedData;
  handleSubscriptionCreated(subscription: any): SubscriptionEventData;
  handleSubscriptionUpdated(subscription: any): SubscriptionEventData;
  handleSubscriptionDeleted(subscription: any): SubscriptionEventData;
  handleInvoicePaid(invoice: any): InvoiceEventData;
  handleInvoicePaymentFailed(invoice: any): InvoiceEventData;
}
