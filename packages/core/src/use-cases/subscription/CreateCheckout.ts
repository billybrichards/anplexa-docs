/**
 * Create Checkout Use Case
 *
 * Orchestrates the Stripe checkout session creation:
 * 1. Validates user exists
 * 2. Gets product/price information
 * 3. Creates Stripe checkout session
 * 4. Returns checkout URL
 */

import type { IUserRepository } from '../../repositories/IUserRepository';

export interface CreateCheckoutRequest {
  userId: string;
  priceId: string;
}

export interface CreateCheckoutResponse {
  sessionId: string;
  checkoutUrl: string;
}

export class CreateCheckout {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(request: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
    // TODO: Implement create checkout logic
    // 1. Validate user exists
    // 2. Get Stripe customer or create one
    // 3. Create checkout session
    // 4. Return session and URL
    throw new Error('CreateCheckout.execute() must be implemented');
  }
}
