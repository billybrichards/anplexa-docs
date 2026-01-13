/**
 * UpdateSubscriptionUseCase - Updates a Stripe subscription
 *
 * This use case handles the business logic for updating subscriptions,
 * including plan changes, cancellation scheduling, and immediate cancellation.
 *
 * Responsibilities:
 * - Validate user and subscription exist
 * - Update subscription via Stripe API
 * - Update user's subscription status in database
 * - Handle cancellation scheduling
 * - Return updated subscription details
 *
 * Usage:
 * ```ts
 * const useCase = new UpdateSubscriptionUseCase(userRepository);
 * const result = await useCase.execute({
 *   userId: 'user-123',
 *   action: 'change_plan',
 *   newPriceId: 'price_yyy'
 * });
 * ```
 */

import {
  getSubscription,
  updateSubscription,
  cancelSubscription,
  scheduleSubscriptionCancellation,
  unscheduleSubscriptionCancellation,
  changeSubscriptionPrice,
} from '@anplexa/services/stripe';
import type { UserRepository } from '../../repositories/UserRepository.js';
import type Stripe from 'stripe';

export type SubscriptionAction =
  | 'change_plan'
  | 'cancel_immediately'
  | 'cancel_at_period_end'
  | 'reactivate';

export interface UpdateSubscriptionRequest {
  userId: string;
  action: SubscriptionAction;
  newPriceId?: string; // Required for 'change_plan'
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

export interface UpdateSubscriptionResponse {
  subscriptionId: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
}

export class UpdateSubscriptionUseCaseError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'USER_NOT_FOUND'
      | 'SUBSCRIPTION_NOT_FOUND'
      | 'INVALID_ACTION'
      | 'STRIPE_ERROR'
      | 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'UpdateSubscriptionUseCaseError';
  }
}

export class UpdateSubscriptionUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Execute the use case to update a subscription
   */
  async execute(request: UpdateSubscriptionRequest): Promise<UpdateSubscriptionResponse> {
    // Validate request
    this.validateRequest(request);

    // Find user
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new UpdateSubscriptionUseCaseError('User not found', 'USER_NOT_FOUND');
    }

    // Validate user has a subscription
    if (!user.stripeSubscriptionId) {
      throw new UpdateSubscriptionUseCaseError(
        'User does not have an active subscription',
        'SUBSCRIPTION_NOT_FOUND'
      );
    }

    // Get current subscription from Stripe
    let subscription: Stripe.Subscription;
    try {
      subscription = await getSubscription(user.stripeSubscriptionId);
    } catch (error) {
      throw new UpdateSubscriptionUseCaseError(
        `Failed to retrieve subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STRIPE_ERROR'
      );
    }

    // Perform the requested action
    try {
      subscription = await this.performAction(request, subscription);
    } catch (error) {
      // Re-throw UpdateSubscriptionUseCaseError as-is to preserve error code
      if (error instanceof UpdateSubscriptionUseCaseError) {
        throw error;
      }
      throw new UpdateSubscriptionUseCaseError(
        `Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STRIPE_ERROR'
      );
    }

    // Update user subscription status in database
    await this.updateUserSubscriptionStatus(user.id, subscription);

    // Return result
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    };
  }

  /**
   * Perform the requested subscription action
   */
  private async performAction(
    request: UpdateSubscriptionRequest,
    subscription: Stripe.Subscription
  ): Promise<Stripe.Subscription> {
    switch (request.action) {
      case 'change_plan':
        if (!request.newPriceId) {
          throw new UpdateSubscriptionUseCaseError(
            'New price ID is required for plan changes',
            'VALIDATION_ERROR'
          );
        }
        return await changeSubscriptionPrice(subscription.id, request.newPriceId, {
          prorationBehavior: request.prorationBehavior || 'create_prorations',
        });

      case 'cancel_immediately':
        return await cancelSubscription(subscription.id, {
          invoiceNow: true,
          prorate: true,
        });

      case 'cancel_at_period_end':
        return await scheduleSubscriptionCancellation(subscription.id);

      case 'reactivate':
        // Only reactivate if it's scheduled for cancellation
        if (!subscription.cancel_at_period_end) {
          throw new UpdateSubscriptionUseCaseError(
            'Subscription is not scheduled for cancellation',
            'INVALID_ACTION'
          );
        }
        return await unscheduleSubscriptionCancellation(subscription.id);

      default:
        throw new UpdateSubscriptionUseCaseError(
          `Invalid action: ${request.action}`,
          'INVALID_ACTION'
        );
    }
  }

  /**
   * Update user's subscription status in the database
   */
  private async updateUserSubscriptionStatus(
    userId: string,
    subscription: Stripe.Subscription
  ): Promise<void> {
    const isActive = ['active', 'trialing'].includes(subscription.status);
    const isCanceled = ['canceled', 'unpaid', 'past_due'].includes(subscription.status);

    let status: 'subscribed' | 'not_subscribed' | 'canceled' | 'past_due';

    if (isActive) {
      status = 'subscribed';
    } else if (subscription.status === 'past_due') {
      status = 'past_due';
    } else if (isCanceled) {
      status = 'canceled';
    } else {
      status = 'not_subscribed';
    }

    await this.userRepository.updateSubscriptionStatus(
      userId,
      status,
      subscription.customer as string,
      subscription.id
    );
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: UpdateSubscriptionRequest): void {
    if (!request.userId || typeof request.userId !== 'string' || request.userId.trim() === '') {
      throw new UpdateSubscriptionUseCaseError('User ID is required', 'VALIDATION_ERROR');
    }

    if (!request.action || typeof request.action !== 'string') {
      throw new UpdateSubscriptionUseCaseError('Action is required', 'VALIDATION_ERROR');
    }

    const validActions: SubscriptionAction[] = [
      'change_plan',
      'cancel_immediately',
      'cancel_at_period_end',
      'reactivate',
    ];

    if (!validActions.includes(request.action)) {
      throw new UpdateSubscriptionUseCaseError(
        `Invalid action. Must be one of: ${validActions.join(', ')}`,
        'VALIDATION_ERROR'
      );
    }

    if (request.action === 'change_plan' && !request.newPriceId) {
      throw new UpdateSubscriptionUseCaseError(
        'New price ID is required for plan changes',
        'VALIDATION_ERROR'
      );
    }
  }
}
