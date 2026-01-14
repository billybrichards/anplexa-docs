/**
 * CreateCheckoutUseCase - Creates a Stripe checkout session for subscriptions
 *
 * This use case handles the business logic for creating a checkout session,
 * including user validation, customer creation/retrieval, and session configuration.
 *
 * Responsibilities:
 * - Validate user exists and has required data
 * - Get or create Stripe customer
 * - Create checkout session with proper metadata
 * - Return checkout session URL for redirect
 *
 * Usage:
 * ```ts
 * const useCase = new CreateCheckoutUseCase(userRepository);
 * const result = await useCase.execute({
 *   userId: 'user-123',
 *   priceId: 'price_xxx',
 *   successUrl: 'https://app.example.com/success',
 *   cancelUrl: 'https://app.example.com/cancel'
 * });
 * ```
 */

import {
  createCheckoutSession,
  createCustomer,
  getCustomer,
  type CheckoutSessionOptions,
} from '@anplexa/services/stripe';
import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface.js';
import type Stripe from 'stripe';

export interface CreateCheckoutRequest {
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutResponse {
  sessionId: string;
  url: string;
  customerId: string;
}

export class CreateCheckoutUseCaseError extends Error {
  constructor(
    message: string,
    public readonly code: 'USER_NOT_FOUND' | 'INVALID_EMAIL' | 'STRIPE_ERROR' | 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'CreateCheckoutUseCaseError';
  }
}

export class CreateCheckoutUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Execute the use case to create a checkout session
   */
  async execute(request: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
    // Validate request
    this.validateRequest(request);

    // Find user
    const user = await this.userRepository.getById(request.userId);
    if (!user) {
      throw new CreateCheckoutUseCaseError('User not found', 'USER_NOT_FOUND');
    }

    // Validate user has email
    if (!user.email) {
      throw new CreateCheckoutUseCaseError('User email is required', 'INVALID_EMAIL');
    }

    // Get or create Stripe customer
    let customerId: string;
    try {
      customerId = await this.getOrCreateCustomer(user);
    } catch (error) {
      throw new CreateCheckoutUseCaseError(
        `Failed to get or create Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STRIPE_ERROR'
      );
    }

    // Create checkout session
    let session: Stripe.Checkout.Session;
    try {
      const checkoutOptions: CheckoutSessionOptions = {
        customerId,
        userId: request.userId,
        metadata: {
          userId: request.userId,
          ...(request.metadata || {}),
        },
      };

      session = await createCheckoutSession(
        request.priceId,
        request.successUrl,
        request.cancelUrl,
        checkoutOptions
      );
    } catch (error) {
      throw new CreateCheckoutUseCaseError(
        `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STRIPE_ERROR'
      );
    }

    // Validate session has URL
    if (!session.url) {
      throw new CreateCheckoutUseCaseError(
        'Checkout session created but no URL returned',
        'STRIPE_ERROR'
      );
    }

    // Return result
    return {
      sessionId: session.id,
      url: session.url,
      customerId,
    };
  }

  /**
   * Get existing Stripe customer or create new one
   */
  private async getOrCreateCustomer(user: {
    id: string;
    email: string;
    displayName: string | null;
    stripeCustomerId: string | null;
  }): Promise<string> {
    // If user already has a Stripe customer ID, verify it exists
    if (user.stripeCustomerId) {
      try {
        const customer = await getCustomer(user.stripeCustomerId);
        // Check if customer exists and is not deleted
        // Note: using 'as any' because Stripe types don't properly expose deleted property
        const isDeleted = 'deleted' in customer ? (customer as any).deleted === true : false;
        if (customer && !isDeleted) {
          return customer.id;
        }
      } catch (error) {
        // Customer doesn't exist or error retrieving, create new one
        console.warn(
          `Stripe customer ${user.stripeCustomerId} not found or error retrieving, creating new one`
        );
      }
    }

    // Create new Stripe customer
    const customer = await createCustomer(user.email, {
      name: user.displayName || undefined,
      userId: user.id,
      metadata: {
        userId: user.id,
      },
    });

    // Update user with new customer ID
    if (this.userRepository.updateStripeCustomerId) {
      await this.userRepository.updateStripeCustomerId(user.id, customer.id);
    } else {
      await this.userRepository.update(user.id, { stripeCustomerId: customer.id });
    }

    return customer.id;
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: CreateCheckoutRequest): void {
    if (!request.userId || typeof request.userId !== 'string' || request.userId.trim() === '') {
      throw new CreateCheckoutUseCaseError('User ID is required', 'VALIDATION_ERROR');
    }

    if (!request.priceId || typeof request.priceId !== 'string' || request.priceId.trim() === '') {
      throw new CreateCheckoutUseCaseError('Price ID is required', 'VALIDATION_ERROR');
    }

    if (
      !request.successUrl ||
      typeof request.successUrl !== 'string' ||
      !this.isValidUrl(request.successUrl)
    ) {
      throw new CreateCheckoutUseCaseError('Valid success URL is required', 'VALIDATION_ERROR');
    }

    if (
      !request.cancelUrl ||
      typeof request.cancelUrl !== 'string' ||
      !this.isValidUrl(request.cancelUrl)
    ) {
      throw new CreateCheckoutUseCaseError('Valid cancel URL is required', 'VALIDATION_ERROR');
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
