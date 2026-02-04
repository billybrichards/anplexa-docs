/**
 * Create Checkout Use Case
 *
 * Orchestrates the Stripe checkout session creation:
 * 1. Validates input
 * 2. Finds user by ID
 * 3. Gets or creates Stripe customer
 * 4. Creates Stripe checkout session
 * 5. Returns session ID and checkout URL
 */

import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface';
import { ValidationError } from '../../domain/errors/ValidationError';
import { AuthenticationError } from '../../domain/errors/AuthenticationError';
import { createCustomer, createCheckoutSession } from '@anplexa/services';

export interface CreateCheckoutRequest {
  userId: string;
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutResponse {
  sessionId: string;
  checkoutUrl: string;
}

export class CreateCheckout {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(request: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
    // 1. Validate input
    await this.validateInput(request);

    // 2. Find user by ID
    const user = await this.userRepository.getById(request.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // 3. Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      // Create new Stripe customer
      const customer = await createCustomer(user.email, {
        name: user.displayName,
        userId: user.id,
        metadata: {
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Save Stripe customer ID to user record
      if (this.userRepository.updateStripeCustomerId) {
        await this.userRepository.updateStripeCustomerId(user.id, stripeCustomerId);
      }
    }

    // 4. Create Stripe checkout session
    const session = await createCheckoutSession(
      request.priceId,
      request.successUrl || `${process.env.APP_URL || 'http://localhost:3000'}/checkout/success`,
      request.cancelUrl || `${process.env.APP_URL || 'http://localhost:3000'}/checkout/cancel`,
      {
        customerId: stripeCustomerId,
        userId: user.id,
        metadata: {
          userId: user.id,
          userEmail: user.email,
        },
      }
    );

    // 5. Return session ID and checkout URL
    return {
      sessionId: session.id,
      checkoutUrl: session.url || '',
    };
  }

  /**
   * Validate create checkout input
   */
  private async validateInput(request: CreateCheckoutRequest): Promise<void> {
    // Validate userId
    if (!request.userId || typeof request.userId !== 'string') {
      throw new ValidationError('User ID is required', 'userId');
    }

    if (request.userId.trim().length === 0) {
      throw new ValidationError('User ID cannot be empty', 'userId');
    }

    // Validate priceId
    if (!request.priceId || typeof request.priceId !== 'string') {
      throw new ValidationError('Price ID is required', 'priceId');
    }

    if (request.priceId.trim().length === 0) {
      throw new ValidationError('Price ID cannot be empty', 'priceId');
    }

    // Basic Stripe price ID format validation (starts with price_)
    if (!request.priceId.startsWith('price_')) {
      throw new ValidationError('Invalid Stripe price ID format', 'priceId');
    }
  }
}
