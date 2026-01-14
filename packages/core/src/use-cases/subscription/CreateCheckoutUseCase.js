"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCheckoutUseCase = exports.CreateCheckoutUseCaseError = void 0;
const stripe_1 = require("@anplexa/services/stripe");
class CreateCheckoutUseCaseError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'CreateCheckoutUseCaseError';
    }
}
exports.CreateCheckoutUseCaseError = CreateCheckoutUseCaseError;
class CreateCheckoutUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    /**
     * Execute the use case to create a checkout session
     */
    async execute(request) {
        // Validate request
        this.validateRequest(request);
        // Find user - use getById if findById is not available
        const user = await (this.userRepository.findById ?? this.userRepository.getById)(request.userId);
        if (!user) {
            throw new CreateCheckoutUseCaseError('User not found', 'USER_NOT_FOUND');
        }
        // Validate user has email
        if (!user.email) {
            throw new CreateCheckoutUseCaseError('User email is required', 'INVALID_EMAIL');
        }
        // Get or create Stripe customer
        let customerId;
        try {
            customerId = await this.getOrCreateCustomer(user);
        }
        catch (error) {
            throw new CreateCheckoutUseCaseError(`Failed to get or create Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`, 'STRIPE_ERROR');
        }
        // Create checkout session
        let session;
        try {
            const checkoutOptions = {
                customerId,
                userId: request.userId,
                metadata: {
                    userId: request.userId,
                    ...(request.metadata || {}),
                },
            };
            session = await (0, stripe_1.createCheckoutSession)(request.priceId, request.successUrl, request.cancelUrl, checkoutOptions);
        }
        catch (error) {
            throw new CreateCheckoutUseCaseError(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`, 'STRIPE_ERROR');
        }
        // Validate session has URL
        if (!session.url) {
            throw new CreateCheckoutUseCaseError('Checkout session created but no URL returned', 'STRIPE_ERROR');
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
    async getOrCreateCustomer(user) {
        // If user already has a Stripe customer ID, verify it exists
        if (user.stripeCustomerId) {
            try {
                const customer = await (0, stripe_1.getCustomer)(user.stripeCustomerId);
                // Check if customer exists and is not deleted
                // Note: using 'as any' because Stripe types don't properly expose deleted property
                const isDeleted = 'deleted' in customer ? customer.deleted === true : false;
                if (customer && !isDeleted) {
                    return customer.id;
                }
            }
            catch (error) {
                // Customer doesn't exist or error retrieving, create new one
                console.warn(`Stripe customer ${user.stripeCustomerId} not found or error retrieving, creating new one`);
            }
        }
        // Create new Stripe customer
        const customer = await (0, stripe_1.createCustomer)(user.email, {
            name: user.displayName || undefined,
            userId: user.id,
            metadata: {
                userId: user.id,
            },
        });
        // Update user with new customer ID
        if (this.userRepository.updateStripeCustomerId) {
            await this.userRepository.updateStripeCustomerId(user.id, customer.id);
        }
        else {
            await this.userRepository.update(user.id, { stripeCustomerId: customer.id });
        }
        return customer.id;
    }
    /**
     * Validate request parameters
     */
    validateRequest(request) {
        if (!request.userId || typeof request.userId !== 'string' || request.userId.trim() === '') {
            throw new CreateCheckoutUseCaseError('User ID is required', 'VALIDATION_ERROR');
        }
        if (!request.priceId || typeof request.priceId !== 'string' || request.priceId.trim() === '') {
            throw new CreateCheckoutUseCaseError('Price ID is required', 'VALIDATION_ERROR');
        }
        if (!request.successUrl ||
            typeof request.successUrl !== 'string' ||
            !this.isValidUrl(request.successUrl)) {
            throw new CreateCheckoutUseCaseError('Valid success URL is required', 'VALIDATION_ERROR');
        }
        if (!request.cancelUrl ||
            typeof request.cancelUrl !== 'string' ||
            !this.isValidUrl(request.cancelUrl)) {
            throw new CreateCheckoutUseCaseError('Valid cancel URL is required', 'VALIDATION_ERROR');
        }
    }
    /**
     * Validate URL format
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.CreateCheckoutUseCase = CreateCheckoutUseCase;
