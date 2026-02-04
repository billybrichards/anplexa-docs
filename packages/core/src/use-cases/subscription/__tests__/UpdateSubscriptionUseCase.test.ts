/**
 * Tests for UpdateSubscriptionUseCase
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  UpdateSubscriptionUseCase,
  UpdateSubscriptionUseCaseError,
  type UpdateSubscriptionRequest,
} from '../UpdateSubscriptionUseCase';
import type { UserRepository, User } from '../../../repositories/UserRepository';
import type Stripe from 'stripe';

// Mock @anplexa/services/stripe
vi.mock('@anplexa/services/stripe', () => ({
  getSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  scheduleSubscriptionCancellation: vi.fn(),
  unscheduleSubscriptionCancellation: vi.fn(),
  changeSubscriptionPrice: vi.fn(),
}));

import {
  getSubscription,
  cancelSubscription,
  scheduleSubscriptionCancellation,
  unscheduleSubscriptionCancellation,
  changeSubscriptionPrice,
} from '@anplexa/services/stripe';

describe('UpdateSubscriptionUseCase', () => {
  let useCase: UpdateSubscriptionUseCase;
  let mockUserRepository: UserRepository;
  let mockUser: User;
  let mockSubscription: Stripe.Subscription;

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
      subscriptionStatus: 'subscribed',
      manualSubscriptionOverride: false,
      credits: 5,
      lastCreditRefresh: null,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
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

    // Create mock subscription
    mockSubscription = {
      id: 'sub_123',
      customer: 'cus_123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
      cancel_at_period_end: false,
      canceled_at: null,
      items: {
        data: [
          {
            id: 'si_123',
            price: {
              id: 'price_xxx',
            },
          },
        ],
      },
    } as any;

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
      updateSubscriptionStatus: vi.fn(),
    };

    // Create use case instance
    useCase = new UpdateSubscriptionUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should change subscription plan', async () => {
      // Arrange
      const request: UpdateSubscriptionRequest = {
        userId: 'user-123',
        action: 'change_plan',
        newPriceId: 'price_yyy',
        prorationBehavior: 'create_prorations',
      };

      const updatedSubscription = {
        ...mockSubscription,
        items: {
          data: [
            {
              id: 'si_123',
              price: {
                id: 'price_yyy',
              },
            },
          ],
        },
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(getSubscription).mockResolvedValue(mockSubscription);
      vi.mocked(changeSubscriptionPrice).mockResolvedValue(updatedSubscription as any);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        subscriptionId: 'sub_123',
        status: 'active',
        cancelAtPeriodEnd: false,
        canceledAt: null,
      });

      expect(changeSubscriptionPrice).toHaveBeenCalledWith('sub_123', 'price_yyy', {
        prorationBehavior: 'create_prorations',
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'subscribed',
        'cus_123',
        'sub_123'
      );
    });

    it('should cancel subscription immediately', async () => {
      // Arrange
      const request: UpdateSubscriptionRequest = {
        userId: 'user-123',
        action: 'cancel_immediately',
      };

      const canceledSubscription = {
        ...mockSubscription,
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(getSubscription).mockResolvedValue(mockSubscription);
      vi.mocked(cancelSubscription).mockResolvedValue(canceledSubscription as any);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        subscriptionId: 'sub_123',
        status: 'canceled',
      });

      expect(cancelSubscription).toHaveBeenCalledWith('sub_123', {
        invoiceNow: true,
        prorate: true,
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'canceled',
        'cus_123',
        'sub_123'
      );
    });

    it('should schedule cancellation at period end', async () => {
      // Arrange
      const request: UpdateSubscriptionRequest = {
        userId: 'user-123',
        action: 'cancel_at_period_end',
      };

      const scheduledSubscription = {
        ...mockSubscription,
        cancel_at_period_end: true,
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(getSubscription).mockResolvedValue(mockSubscription);
      vi.mocked(scheduleSubscriptionCancellation).mockResolvedValue(scheduledSubscription as any);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        subscriptionId: 'sub_123',
        status: 'active',
        cancelAtPeriodEnd: true,
      });

      expect(scheduleSubscriptionCancellation).toHaveBeenCalledWith('sub_123');

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'subscribed',
        'cus_123',
        'sub_123'
      );
    });

    it('should reactivate scheduled cancellation', async () => {
      // Arrange
      const request: UpdateSubscriptionRequest = {
        userId: 'user-123',
        action: 'reactivate',
      };

      const scheduledSubscription = {
        ...mockSubscription,
        cancel_at_period_end: true,
      };

      const reactivatedSubscription = {
        ...mockSubscription,
        cancel_at_period_end: false,
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(getSubscription).mockResolvedValue(scheduledSubscription as any);
      vi.mocked(unscheduleSubscriptionCancellation).mockResolvedValue(
        reactivatedSubscription as any
      );
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        subscriptionId: 'sub_123',
        status: 'active',
        cancelAtPeriodEnd: false,
      });

      expect(unscheduleSubscriptionCancellation).toHaveBeenCalledWith('sub_123');
    });

    it('should throw error when reactivating non-scheduled subscription', async () => {
      // Arrange
      const request: UpdateSubscriptionRequest = {
        userId: 'user-123',
        action: 'reactivate',
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(getSubscription).mockResolvedValue(mockSubscription);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(UpdateSubscriptionUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'INVALID_ACTION',
        message: 'Subscription is not scheduled for cancellation',
      });
    });

    it('should update status to past_due for past_due subscriptions', async () => {
      // Arrange
      const request: UpdateSubscriptionRequest = {
        userId: 'user-123',
        action: 'cancel_at_period_end',
      };

      const pastDueSubscription = {
        ...mockSubscription,
        status: 'past_due',
        cancel_at_period_end: true,
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(getSubscription).mockResolvedValue(mockSubscription);
      vi.mocked(scheduleSubscriptionCancellation).mockResolvedValue(pastDueSubscription as any);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(mockUser);

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'past_due',
        'cus_123',
        'sub_123'
      );
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const request: UpdateSubscriptionRequest = {
        userId: 'nonexistent',
        action: 'cancel_immediately',
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(UpdateSubscriptionUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    });

    it('should throw error if user has no subscription', async () => {
      // Arrange
      const request: UpdateSubscriptionRequest = {
        userId: 'user-123',
        action: 'cancel_immediately',
      };

      const userWithoutSub = { ...mockUser, stripeSubscriptionId: null };
      vi.mocked(mockUserRepository.getById).mockResolvedValue(userWithoutSub);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(UpdateSubscriptionUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'SUBSCRIPTION_NOT_FOUND',
        message: 'User does not have an active subscription',
      });
    });

    it('should throw error if userId is missing', async () => {
      // Arrange
      const request: UpdateSubscriptionRequest = {
        userId: '',
        action: 'cancel_immediately',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(UpdateSubscriptionUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'User ID is required',
      });
    });

    it('should throw error if action is invalid', async () => {
      // Arrange
      const request: UpdateSubscriptionRequest = {
        userId: 'user-123',
        action: 'invalid_action' as any,
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(UpdateSubscriptionUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('should throw error if newPriceId is missing for change_plan', async () => {
      // Arrange
      const request: UpdateSubscriptionRequest = {
        userId: 'user-123',
        action: 'change_plan',
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(UpdateSubscriptionUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'New price ID is required for plan changes',
      });
    });

    it('should throw error if Stripe API fails', async () => {
      // Arrange
      const request: UpdateSubscriptionRequest = {
        userId: 'user-123',
        action: 'cancel_immediately',
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(getSubscription).mockRejectedValue(new Error('Stripe API error'));

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(UpdateSubscriptionUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'STRIPE_ERROR',
      });
    });
  });
});
