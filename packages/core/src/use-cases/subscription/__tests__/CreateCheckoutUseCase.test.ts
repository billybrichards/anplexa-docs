/**
 * Tests for CreateCheckoutUseCase
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CreateCheckoutUseCase,
  CreateCheckoutUseCaseError,
  type CreateCheckoutRequest,
} from '../CreateCheckoutUseCase';
import type { UserRepository, User } from '../../../repositories/UserRepository';
import type { IStripeService } from '../../../domain/services/IStripeService';

describe('CreateCheckoutUseCase', () => {
  let useCase: CreateCheckoutUseCase;
  let mockUserRepository: UserRepository;
  let mockStripeService: IStripeService;
  let mockUser: User;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock user
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      chatName: null,
      passwordHash: 'hashed',
      personalityMode: null,
      preferredGender: null,
      customGender: null,
      storagePreference: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      isAdmin: false,
      subscriptionStatus: 'not_subscribed',
      manualSubscriptionOverride: false,
      credits: 5,
      lastCreditRefresh: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      accountSource: 'anplexa',
      funnelType: null,
      persona: null,
      stage: null,
      entrySource: null,
      usedFreeMessages: 0,
      emailOpened1: false,
      emailOpened2: false,
      emailOpened3: false,
      clickedUseApp: false,
      feedbackSubmitted: false,
      refundRequested: false,
      refundProcessed: false,
      lastActivityAt: null,
      amplexaFunnel: null,
      amplexaFunnelName: null,
      amplexaResponses: null,
      amplexaPrimaryNeed: null,
      amplexaCommunicationStyle: null,
      amplexaPace: null,
      amplexaTags: null,
      amplexaTimestamp: null,
      sourceChannel: null,
    };

    // Create mock repository - using IUserRepository interface method names
    mockUserRepository = {
      getById: vi.fn(),
      getByEmail: vi.fn(),
      getByStripeCustomerId: vi.fn(),
      getByStripeSubscriptionId: vi.fn(),
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateStripeCustomerId: vi.fn(),
      updateSubscriptionStatus: vi.fn(),
    };

    // Create mock stripe service
    mockStripeService = {
      createCheckoutSession: vi.fn(),
      createCustomer: vi.fn(),
      getCustomer: vi.fn(),
      getSubscription: vi.fn(),
      cancelSubscription: vi.fn(),
      scheduleSubscriptionCancellation: vi.fn(),
      unscheduleSubscriptionCancellation: vi.fn(),
      changeSubscriptionPrice: vi.fn(),
      constructWebhookEvent: vi.fn(),
      handleCheckoutCompleted: vi.fn(),
      handleSubscriptionCreated: vi.fn(),
      handleSubscriptionUpdated: vi.fn(),
      handleSubscriptionDeleted: vi.fn(),
      handleInvoicePaid: vi.fn(),
      handleInvoicePaymentFailed: vi.fn(),
    };

    // Create use case instance
    useCase = new CreateCheckoutUseCase(mockUserRepository, mockStripeService);
  });

  describe('execute', () => {
    it('should create checkout session for user without Stripe customer', async () => {
      // Arrange
      const request: CreateCheckoutRequest = {
        userId: 'user-123',
        priceId: 'price_xxx',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockStripeService.createCustomer).mockResolvedValue({ id: 'cus_123' });
      vi.mocked(mockStripeService.createCheckoutSession).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      });
      vi.mocked(mockUserRepository.updateStripeCustomerId).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toEqual({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        customerId: 'cus_123',
      });

      expect(mockUserRepository.getById).toHaveBeenCalledWith('user-123');
      expect(mockStripeService.createCustomer).toHaveBeenCalledWith('test@example.com', {
        name: 'Test User',
        userId: 'user-123',
        metadata: { userId: 'user-123' },
      });
      expect(mockUserRepository.updateStripeCustomerId).toHaveBeenCalledWith('user-123', 'cus_123');
      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        'price_xxx',
        'https://example.com/success',
        'https://example.com/cancel',
        {
          customerId: 'cus_123',
          userId: 'user-123',
          metadata: { userId: 'user-123' },
        }
      );
    });

    it('should use existing Stripe customer if available', async () => {
      // Arrange
      const request: CreateCheckoutRequest = {
        userId: 'user-123',
        priceId: 'price_xxx',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const userWithCustomer = {
        ...mockUser,
        stripeCustomerId: 'cus_existing',
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(userWithCustomer);
      vi.mocked(mockStripeService.getCustomer).mockResolvedValue({ id: 'cus_existing' });
      vi.mocked(mockStripeService.createCheckoutSession).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      });

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toEqual({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        customerId: 'cus_existing',
      });

      expect(mockStripeService.getCustomer).toHaveBeenCalledWith('cus_existing');
      expect(mockStripeService.createCustomer).not.toHaveBeenCalled();
      expect(mockUserRepository.updateStripeCustomerId).not.toHaveBeenCalled();
    });

    it('should create new customer if existing one is deleted', async () => {
      // Arrange
      const request: CreateCheckoutRequest = {
        userId: 'user-123',
        priceId: 'price_xxx',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const userWithCustomer = {
        ...mockUser,
        stripeCustomerId: 'cus_deleted',
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(userWithCustomer);
      vi.mocked(mockStripeService.getCustomer).mockResolvedValue({ id: 'cus_deleted', deleted: true } as any);
      vi.mocked(mockStripeService.createCustomer).mockResolvedValue({ id: 'cus_new' });
      vi.mocked(mockStripeService.createCheckoutSession).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      });
      vi.mocked(mockUserRepository.updateStripeCustomerId).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.customerId).toBe('cus_new');
      expect(mockStripeService.createCustomer).toHaveBeenCalled();
      expect(mockUserRepository.updateStripeCustomerId).toHaveBeenCalledWith('user-123', 'cus_new');
    });

    it('should include metadata in checkout session', async () => {
      // Arrange
      const request: CreateCheckoutRequest = {
        userId: 'user-123',
        priceId: 'price_xxx',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        metadata: {
          campaign: 'summer_sale',
          referrer: 'instagram',
        },
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockStripeService.createCustomer).mockResolvedValue({ id: 'cus_123' });
      vi.mocked(mockStripeService.createCheckoutSession).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      });
      vi.mocked(mockUserRepository.updateStripeCustomerId).mockResolvedValue(mockUser);

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        'price_xxx',
        'https://example.com/success',
        'https://example.com/cancel',
        {
          customerId: 'cus_123',
          userId: 'user-123',
          metadata: {
            userId: 'user-123',
            campaign: 'summer_sale',
            referrer: 'instagram',
          },
        }
      );
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const request: CreateCheckoutRequest = {
        userId: 'nonexistent',
        priceId: 'price_xxx',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(CreateCheckoutUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    });

    it('should throw error if user has no email', async () => {
      // Arrange
      const request: CreateCheckoutRequest = {
        userId: 'user-123',
        priceId: 'price_xxx',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const userWithoutEmail = { ...mockUser, email: '' };
      vi.mocked(mockUserRepository.getById).mockResolvedValue(userWithoutEmail);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(CreateCheckoutUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'INVALID_EMAIL',
        message: 'User email is required',
      });
    });

    it('should throw error if userId is missing', async () => {
      // Arrange
      const request: CreateCheckoutRequest = {
        userId: '',
        priceId: 'price_xxx',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(CreateCheckoutUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'User ID is required',
      });
    });

    it('should throw error if priceId is missing', async () => {
      // Arrange
      const request: CreateCheckoutRequest = {
        userId: 'user-123',
        priceId: '',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(CreateCheckoutUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Price ID is required',
      });
    });

    it('should throw error if successUrl is invalid', async () => {
      // Arrange
      const request: CreateCheckoutRequest = {
        userId: 'user-123',
        priceId: 'price_xxx',
        successUrl: 'not-a-url',
        cancelUrl: 'https://example.com/cancel',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(CreateCheckoutUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Valid success URL is required',
      });
    });

    it('should throw error if cancelUrl is invalid', async () => {
      // Arrange
      const request: CreateCheckoutRequest = {
        userId: 'user-123',
        priceId: 'price_xxx',
        successUrl: 'https://example.com/success',
        cancelUrl: 'not-a-url',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(CreateCheckoutUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Valid cancel URL is required',
      });
    });

    it('should throw error if checkout session has no URL', async () => {
      // Arrange
      const request: CreateCheckoutRequest = {
        userId: 'user-123',
        priceId: 'price_xxx',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockStripeService.createCustomer).mockResolvedValue({ id: 'cus_123' });
      vi.mocked(mockStripeService.createCheckoutSession).mockResolvedValue({
        id: 'cs_test_123',
        url: null,
      });
      vi.mocked(mockUserRepository.updateStripeCustomerId).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(CreateCheckoutUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'STRIPE_ERROR',
        message: 'Checkout session created but no URL returned',
      });
    });

    it('should throw error if Stripe customer creation fails', async () => {
      // Arrange
      const request: CreateCheckoutRequest = {
        userId: 'user-123',
        priceId: 'price_xxx',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockStripeService.createCustomer).mockRejectedValue(new Error('Stripe API error'));

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(CreateCheckoutUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'STRIPE_ERROR',
      });
    });

    it('should throw error if checkout session creation fails', async () => {
      // Arrange
      const request: CreateCheckoutRequest = {
        userId: 'user-123',
        priceId: 'price_xxx',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockStripeService.createCustomer).mockResolvedValue({ id: 'cus_123' });
      vi.mocked(mockStripeService.createCheckoutSession).mockRejectedValue(new Error('Stripe API error'));
      vi.mocked(mockUserRepository.updateStripeCustomerId).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(CreateCheckoutUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'STRIPE_ERROR',
      });
    });
  });
});
