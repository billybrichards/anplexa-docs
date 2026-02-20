/**
 * HandleWebhookUseCase - Processes Stripe webhook events
 *
 * This use case handles all Stripe webhook events related to subscriptions,
 * checkout sessions, and invoices. It verifies webhook signatures and updates
 * user data based on the event type.
 *
 * Supported Events:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.paid
 * - invoice.payment_failed
 *
 * Responsibilities:
 * - Verify webhook signature
 * - Parse webhook event
 * - Route to appropriate handler
 * - Update user/subscription data
 * - Return processing result
 *
 * Usage:
 * ```ts
 * const useCase = new HandleWebhookUseCase(userRepository, stripeService);
 * const result = await useCase.execute({
 *   payload: rawBody,
 *   signature: req.headers['stripe-signature']
 * });
 * ```
 */

import type {
  IStripeService,
  WebhookEvent,
} from '../../domain/services/IStripeService.js';
import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface.js';

export interface HandleWebhookRequest {
  payload: Buffer | string;
  signature: string;
}

export interface HandleWebhookResponse {
  eventId: string;
  eventType: string;
  processed: boolean;
  userId?: string;
  message: string;
}

export class HandleWebhookUseCaseError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_SIGNATURE'
      | 'INVALID_PAYLOAD'
      | 'UNSUPPORTED_EVENT'
      | 'USER_NOT_FOUND'
      | 'PROCESSING_ERROR'
  ) {
    super(message);
    this.name = 'HandleWebhookUseCaseError';
  }
}

export class HandleWebhookUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly stripeService: IStripeService,
  ) {}

  /**
   * Execute the use case to handle a webhook event
   */
  async execute(request: HandleWebhookRequest): Promise<HandleWebhookResponse> {
    // Verify and construct webhook event
    let event: WebhookEvent;
    try {
      event = this.stripeService.constructWebhookEvent(request.payload, request.signature);
    } catch (error) {
      throw new HandleWebhookUseCaseError(
        `Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INVALID_SIGNATURE'
      );
    }

    // Log event for debugging
    console.log(`Processing webhook event: ${event.type} (${event.id})`);

    // Route to appropriate handler
    try {
      const result = await this.routeEvent(event);
      return {
        eventId: event.id,
        eventType: event.type,
        processed: result.processed,
        userId: result.userId,
        message: result.message,
      };
    } catch (error) {
      // Re-throw HandleWebhookUseCaseError as-is to preserve error code
      if (error instanceof HandleWebhookUseCaseError) {
        throw error;
      }
      throw new HandleWebhookUseCaseError(
        `Failed to process webhook event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PROCESSING_ERROR'
      );
    }
  }

  /**
   * Route event to appropriate handler
   */
  private async routeEvent(event: WebhookEvent): Promise<{
    processed: boolean;
    userId?: string;
    message: string;
  }> {
    switch (event.type) {
      case 'checkout.session.completed':
        return await this.handleCheckoutSessionCompleted(event.data.object);

      case 'customer.subscription.created':
        return await this.handleSubscriptionCreated(event.data.object);

      case 'customer.subscription.updated':
        return await this.handleSubscriptionUpdated(event.data.object);

      case 'customer.subscription.deleted':
        return await this.handleSubscriptionDeleted(event.data.object);

      case 'invoice.paid':
        return await this.handleInvoicePaid(event.data.object);

      case 'invoice.payment_failed':
        return await this.handleInvoicePaymentFailed(event.data.object);

      default:
        console.log(`Unsupported webhook event type: ${event.type}`);
        return {
          processed: false,
          message: `Unsupported event type: ${event.type}`,
        };
    }
  }

  /**
   * Handle checkout.session.completed event
   */
  private async handleCheckoutSessionCompleted(
    session: any
  ): Promise<{ processed: boolean; userId?: string; message: string }> {
    const sessionData = this.stripeService.handleCheckoutCompleted(session);

    // Get user ID from metadata
    const userId = session.metadata?.userId || session.client_reference_id;
    if (!userId) {
      console.warn('Checkout session completed but no userId found in metadata');
      return {
        processed: false,
        message: 'No userId found in checkout session metadata',
      };
    }

    // Find user
    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new HandleWebhookUseCaseError('User not found', 'USER_NOT_FOUND');
    }

    // Update user with Stripe customer ID and subscription ID
    await this.userRepository.update(userId, {
      stripeCustomerId: sessionData.customerId,
      stripeSubscriptionId: sessionData.subscriptionId || undefined,
      subscriptionStatus: sessionData.subscriptionId ? 'subscribed' : 'not_subscribed',
      updatedAt: new Date().toISOString(),
    });

    return {
      processed: true,
      userId,
      message: `Checkout completed for user ${userId}`,
    };
  }

  /**
   * Handle customer.subscription.created event
   */
  private async handleSubscriptionCreated(
    subscription: any
  ): Promise<{ processed: boolean; userId?: string; message: string }> {
    const subscriptionData = this.stripeService.handleSubscriptionCreated(subscription);

    // Find user by Stripe customer ID
    const user = await this.userRepository.getByStripeCustomerId(subscriptionData.customerId);
    if (!user) {
      // Try to find by metadata
      const userId = subscription.metadata?.userId;
      if (!userId) {
        console.warn('Subscription created but no user found');
        return {
          processed: false,
          message: 'No user found for subscription',
        };
      }

      const userById = await this.userRepository.getById(userId);
      if (!userById) {
        throw new HandleWebhookUseCaseError('User not found', 'USER_NOT_FOUND');
      }

      // Update user with subscription
      await this.userRepository.updateSubscriptionStatus(
        userId,
        subscriptionData.isActive ? 'subscribed' : 'not_subscribed',
        subscriptionData.customerId,
        subscriptionData.subscriptionId
      );

      return {
        processed: true,
        userId,
        message: `Subscription created for user ${userId}`,
      };
    }

    // Update user with subscription
    await this.userRepository.updateSubscriptionStatus(
      user.id,
      subscriptionData.isActive ? 'subscribed' : 'not_subscribed',
      subscriptionData.customerId,
      subscriptionData.subscriptionId
    );

    return {
      processed: true,
      userId: user.id,
      message: `Subscription created for user ${user.id}`,
    };
  }

  /**
   * Handle customer.subscription.updated event
   */
  private async handleSubscriptionUpdated(
    subscription: any
  ): Promise<{ processed: boolean; userId?: string; message: string }> {
    const subscriptionData = this.stripeService.handleSubscriptionUpdated(subscription);

    // Find user by Stripe subscription ID
    const user = await this.userRepository.getByStripeSubscriptionId(
      subscriptionData.subscriptionId
    );
    if (!user) {
      console.warn('Subscription updated but no user found');
      return {
        processed: false,
        message: 'No user found for subscription',
      };
    }

    // Determine status
    let status: 'subscribed' | 'not_subscribed' | 'canceled' | 'past_due';
    if (subscriptionData.isActive) {
      status = 'subscribed';
    } else if (subscriptionData.status === 'past_due') {
      status = 'past_due';
    } else if (subscriptionData.isCanceled) {
      status = 'canceled';
    } else {
      status = 'not_subscribed';
    }

    // Update user subscription status
    await this.userRepository.updateSubscriptionStatus(
      user.id,
      status,
      subscriptionData.customerId,
      subscriptionData.subscriptionId
    );

    return {
      processed: true,
      userId: user.id,
      message: `Subscription updated for user ${user.id} - status: ${status}`,
    };
  }

  /**
   * Handle customer.subscription.deleted event
   */
  private async handleSubscriptionDeleted(
    subscription: any
  ): Promise<{ processed: boolean; userId?: string; message: string }> {
    const subscriptionData = this.stripeService.handleSubscriptionDeleted(subscription);

    // Find user by Stripe subscription ID
    const user = await this.userRepository.getByStripeSubscriptionId(
      subscriptionData.subscriptionId
    );
    if (!user) {
      console.warn('Subscription deleted but no user found');
      return {
        processed: false,
        message: 'No user found for subscription',
      };
    }

    // Update user to canceled status
    await this.userRepository.updateSubscriptionStatus(
      user.id,
      'canceled',
      subscriptionData.customerId,
      subscriptionData.subscriptionId
    );

    return {
      processed: true,
      userId: user.id,
      message: `Subscription canceled for user ${user.id}`,
    };
  }

  /**
   * Handle invoice.paid event
   */
  private async handleInvoicePaid(
    invoice: any
  ): Promise<{ processed: boolean; userId?: string; message: string }> {
    const invoiceData = this.stripeService.handleInvoicePaid(invoice);

    // Only process if this is a subscription invoice
    if (!invoiceData.subscriptionId) {
      return {
        processed: false,
        message: 'Invoice is not related to a subscription',
      };
    }

    // Find user by Stripe customer ID
    const user = await this.userRepository.getByStripeCustomerId(invoiceData.customerId);
    if (!user) {
      console.warn('Invoice paid but no user found');
      return {
        processed: false,
        message: 'No user found for invoice',
      };
    }

    // Update user's last activity timestamp
    await this.userRepository.update(user.id, {
      updatedAt: new Date().toISOString(),
    });

    return {
      processed: true,
      userId: user.id,
      message: `Invoice paid for user ${user.id} - amount: ${(invoiceData.amountPaid || 0) / 100} ${invoiceData.currency}`,
    };
  }

  /**
   * Handle invoice.payment_failed event
   */
  private async handleInvoicePaymentFailed(
    invoice: any
  ): Promise<{ processed: boolean; userId?: string; message: string }> {
    const invoiceData = this.stripeService.handleInvoicePaymentFailed(invoice);

    // Only process if this is a subscription invoice
    if (!invoiceData.subscriptionId) {
      return {
        processed: false,
        message: 'Invoice is not related to a subscription',
      };
    }

    // Find user by Stripe customer ID
    const user = await this.userRepository.getByStripeCustomerId(invoiceData.customerId);
    if (!user) {
      console.warn('Invoice payment failed but no user found');
      return {
        processed: false,
        message: 'No user found for invoice',
      };
    }

    // Update user to past_due status
    await this.userRepository.updateSubscriptionStatus(
      user.id,
      'past_due',
      invoiceData.customerId,
      invoiceData.subscriptionId
    );

    return {
      processed: true,
      userId: user.id,
      message: `Invoice payment failed for user ${user.id} - amount due: ${(invoiceData.amountDue || 0) / 100} ${invoiceData.currency}`,
    };
  }
}
