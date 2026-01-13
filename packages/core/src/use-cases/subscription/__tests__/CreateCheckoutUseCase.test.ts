/**
 * Tests for CreateCheckoutUseCase
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CreateCheckoutUseCase,
  CreateCheckoutUseCaseError,
  type CreateCheckoutRequest,
} from '../CreateCheckoutUseCase.js';
import type { UserRepository, User } from '../../../repositories/UserRepository.js';
import type Stripe from 'stripe';

// Mock @anplexa/services/stripe
vi.mock('@anplexa/services/stripe', () => ({
  createCheckoutSession: vi.fn(),
  createCustomer: vi.fn(),
  getCustomer: vi.fn(),
}));

import {
  createCheckoutSession,
  createCustomer,
  getCustomer,
} from '@anplexa/services/stripe';

describe('CreateCheckoutUseCase', () => {
  let useCase: CreateCheckoutUseCase;
  let mockUserRepository: UserRepository;
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

    // Create mock repository
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByStripeCustomerId: vi.fn(),
      findByStripeSubscriptionId: vi.fn(),
      update: vi.fn(),
      updateSubscriptionStatus: vi.fn(),
      updateStripeCustomerId: vi.fn(),
      updateCredits: vi.fn(),
    };

    // Create use case instance
    useCase = new CreateCheckoutUseCase(mockUserRepository);
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

      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
        deleted: false,
      } as Stripe.Customer;

      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        customer: 'cus_123',
      } as Stripe.Checkout.Session;

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(createCustomer).mockResolvedValue(mockCustomer);
      vi.mocked(createCheckoutSession).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepository.updateStripeCustomerId).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toEqual({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        customerId: 'cus_123',
      });

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(createCustomer).toHaveBeenCalledWith('test@example.com', {
        name: 'Test User',
        userId: 'user-123',
        metadata: { userId: 'user-123' },
      });
      expect(mockUserRepository.updateStripeCustomerId).toHaveBeenCalledWith('user-123', 'cus_123');
      expect(createCheckoutSession).toHaveBeenCalledWith(
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

      const mockCustomer = {
        id: 'cus_existing',
        email: 'test@example.com',
        deleted: false,
      } as Stripe.Customer;

      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        customer: 'cus_existing',
      } as Stripe.Checkout.Session;

      vi.mocked(mockUserRepository.findById).mockResolvedValue(userWithCustomer);
      vi.mocked(getCustomer).mockResolvedValue(mockCustomer);
      vi.mocked(createCheckoutSession).mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toEqual({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        customerId: 'cus_existing',
      });

      expect(getCustomer).toHaveBeenCalledWith('cus_existing');
      expect(createCustomer).not.toHaveBeenCalled();
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

      const mockDeletedCustomer = {
        id: 'cus_deleted',
        deleted: true,
      } as Stripe.DeletedCustomer;

      const mockNewCustomer = {
        id: 'cus_new',
        email: 'test@example.com',
        deleted: false,
      } as Stripe.Customer;

      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        customer: 'cus_new',
      } as Stripe.Checkout.Session;

      vi.mocked(mockUserRepository.findById).mockResolvedValue(userWithCustomer);
      vi.mocked(getCustomer).mockResolvedValue(mockDeletedCustomer as any);
      vi.mocked(createCustomer).mockResolvedValue(mockNewCustomer);
      vi.mocked(createCheckoutSession).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepository.updateStripeCustomerId).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.customerId).toBe('cus_new');
      expect(createCustomer).toHaveBeenCalled();
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

      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
        deleted: false,
      } as Stripe.Customer;

      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        customer: 'cus_123',
      } as Stripe.Checkout.Session;

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(createCustomer).mockResolvedValue(mockCustomer);
      vi.mocked(createCheckoutSession).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepository.updateStripeCustomerId).mockResolvedValue(mockUser);

      // Act
      await useCase.execute(request);

      // Assert
      expect(createCheckoutSession).toHaveBeenCalledWith(
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

      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

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
      vi.mocked(mockUserRepository.findById).mockResolvedValue(userWithoutEmail);

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

      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
        deleted: false,
      } as Stripe.Customer;

      const mockSession = {
        id: 'cs_test_123',
        url: null,
        customer: 'cus_123',
      } as Stripe.Checkout.Session;

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(createCustomer).mockResolvedValue(mockCustomer);
      vi.mocked(createCheckoutSession).mockResolvedValue(mockSession);
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

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(createCustomer).mockRejectedValue(new Error('Stripe API error'));

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

      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
        deleted: false,
      } as Stripe.Customer;

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(createCustomer).mockResolvedValue(mockCustomer);
      vi.mocked(createCheckoutSession).mockRejectedValue(new Error('Stripe API error'));
      vi.mocked(mockUserRepository.updateStripeCustomerId).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(CreateCheckoutUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'STRIPE_ERROR',
      });
    });
  });
});
