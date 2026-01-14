/**
 * UpdateSubscriptionUseCase Tests
 *
 * Tests the subscription update business logic including:
 * - Plan changes
 * - Cancellation (immediate and scheduled)
 * - Reactivation
 * - User and subscription validation
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IUserRepository } from '../../../repositories/interfaces/user.repository.interface';
import type { User } from '@anplexa/database';
import type Stripe from 'stripe';

// Create hoisted mocks to ensure they're applied before module imports
const { getSubscription, updateSubscription, cancelSubscription, scheduleSubscriptionCancellation, unscheduleSubscriptionCancellation, changeSubscriptionPrice } = vi.hoisted(() => ({
  getSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  scheduleSubscriptionCancellation: vi.fn(),
  unscheduleSubscriptionCancellation: vi.fn(),
  changeSubscriptionPrice: vi.fn(),
}));

// Mock the Stripe service functions BEFORE importing the use case
vi.mock('@anplexa/services/stripe', () => ({
  getSubscription,
  updateSubscription,
  cancelSubscription,
  scheduleSubscriptionCancellation,
  unscheduleSubscriptionCancellation,
  changeSubscriptionPrice,
}));

// Import after mocking
import {
  UpdateSubscriptionUseCase,
  UpdateSubscriptionUseCaseError,
} from '../../subscription/UpdateSubscriptionUseCase';

describe('UpdateSubscriptionUseCase', () => {
  let useCase: UpdateSubscriptionUseCase;
  let mockUserRepository: IUserRepository;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    displayName: 'Test User',
    chatName: null,
    personalityMode: null,
    storagePreference: null,
    isAdmin: false,
    subscriptionStatus: 'subscribed',
    credits: 100,
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_123',
    accountSource: 'direct',
    sourceChannel: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockSubscription: Stripe.Subscription = {
    id: 'sub_123',
    object: 'subscription',
    customer: 'cus_123',
    status: 'active',
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    current_period_start: Math.floor(Date.now() / 1000),
    cancel_at_period_end: false,
    canceled_at: null,
    items: {
      object: 'list',
      data: [
        {
          id: 'si_123',
          object: 'subscription_item',
          price: {
            id: 'price_123',
            object: 'price',
            active: true,
            currency: 'usd',
            product: 'prod_123',
            unit_amount: 999,
          } as any,
        } as any,
      ],
    } as any,
  } as any;

  beforeEach(() => {
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

    // Reset all mocks
    vi.clearAllMocks();

    useCase = new UpdateSubscriptionUseCase(mockUserRepository);
  });

  describe('execute - change_plan', () => {
    it('should successfully change subscription plan', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);
      changeSubscriptionPrice.mockResolvedValue({
        ...mockSubscription,
        items: {
          object: 'list',
          data: [
            {
              ...mockSubscription.items.data[0],
              price: { ...mockSubscription.items.data[0].price, id: 'price_new' },
            },
          ],
        },
      });

      // Execute
      const result = await useCase.execute({
        userId: 'user-123',
        action: 'change_plan',
        newPriceId: 'price_new',
      });

      // Verify
      expect(result.subscriptionId).toBe('sub_123');
      expect(result.status).toBe('active');
      expect(changeSubscriptionPrice).toHaveBeenCalledWith(
        'sub_123',
        'price_new',
        { prorationBehavior: 'create_prorations' }
      );
      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'subscribed',
        'cus_123',
        'sub_123'
      );
    });

    it('should support custom proration behavior', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);
      changeSubscriptionPrice.mockResolvedValue(mockSubscription);

      await useCase.execute({
        userId: 'user-123',
        action: 'change_plan',
        newPriceId: 'price_new',
        prorationBehavior: 'none',
      });

      expect(changeSubscriptionPrice).toHaveBeenCalledWith(
        'sub_123',
        'price_new',
        { prorationBehavior: 'none' }
      );
    });

    it('should throw error when newPriceId is missing for change_plan', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);

      await expect(
        useCase.execute({
          userId: 'user-123',
          action: 'change_plan',
        })
      ).rejects.toThrow(UpdateSubscriptionUseCaseError);

      await expect(
        useCase.execute({
          userId: 'user-123',
          action: 'change_plan',
        })
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'New price ID is required for plan changes',
      });
    });
  });

  describe('execute - cancel_immediately', () => {
    it('should immediately cancel subscription', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);
      cancelSubscription.mockResolvedValue({
        ...mockSubscription,
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000),
      });

      const result = await useCase.execute({
        userId: 'user-123',
        action: 'cancel_immediately',
      });

      expect(result.status).toBe('canceled');
      expect(result.canceledAt).toBeInstanceOf(Date);
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
  });

  describe('execute - cancel_at_period_end', () => {
    it('should schedule subscription cancellation at period end', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);
      scheduleSubscriptionCancellation.mockResolvedValue({
        ...mockSubscription,
        cancel_at_period_end: true,
      });

      const result = await useCase.execute({
        userId: 'user-123',
        action: 'cancel_at_period_end',
      });

      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(scheduleSubscriptionCancellation).toHaveBeenCalledWith('sub_123');
      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'subscribed',
        'cus_123',
        'sub_123'
      );
    });
  });

  describe('execute - reactivate', () => {
    it('should reactivate scheduled cancellation', async () => {
      const scheduledSubscription = {
        ...mockSubscription,
        cancel_at_period_end: true,
      };

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(scheduledSubscription);
      unscheduleSubscriptionCancellation.mockResolvedValue({
        ...scheduledSubscription,
        cancel_at_period_end: false,
      });

      const result = await useCase.execute({
        userId: 'user-123',
        action: 'reactivate',
      });

      expect(result.cancelAtPeriodEnd).toBe(false);
      expect(unscheduleSubscriptionCancellation).toHaveBeenCalledWith(
        'sub_123'
      );
    });

    it('should throw error when trying to reactivate non-scheduled subscription', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);

      await expect(
        useCase.execute({
          userId: 'user-123',
          action: 'reactivate',
        })
      ).rejects.toThrow(UpdateSubscriptionUseCaseError);

      await expect(
        useCase.execute({
          userId: 'user-123',
          action: 'reactivate',
        })
      ).rejects.toMatchObject({
        code: 'INVALID_ACTION',
        message: 'Subscription is not scheduled for cancellation',
      });
    });
  });

  describe('validation', () => {
    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(null);

      await expect(
        useCase.execute({
          userId: 'non-existent',
          action: 'cancel_immediately',
        })
      ).rejects.toThrow(UpdateSubscriptionUseCaseError);

      await expect(
        useCase.execute({
          userId: 'non-existent',
          action: 'cancel_immediately',
        })
      ).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
      });
    });

    it('should throw SUBSCRIPTION_NOT_FOUND when user has no subscription', async () => {
      const userWithoutSub = { ...mockUser, stripeSubscriptionId: null };
      vi.mocked(mockUserRepository.getById).mockResolvedValue(userWithoutSub);

      await expect(
        useCase.execute({
          userId: 'user-123',
          action: 'cancel_immediately',
        })
      ).rejects.toThrow(UpdateSubscriptionUseCaseError);

      await expect(
        useCase.execute({
          userId: 'user-123',
          action: 'cancel_immediately',
        })
      ).rejects.toMatchObject({
        code: 'SUBSCRIPTION_NOT_FOUND',
      });
    });

    it('should throw VALIDATION_ERROR for missing userId', async () => {
      await expect(
        useCase.execute({
          userId: '',
          action: 'cancel_immediately',
        })
      ).rejects.toThrow(UpdateSubscriptionUseCaseError);

      await expect(
        useCase.execute({
          userId: '',
          action: 'cancel_immediately',
        })
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'User ID is required',
      });
    });

    it('should throw VALIDATION_ERROR for invalid action', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          action: 'invalid_action' as any,
        })
      ).rejects.toThrow(UpdateSubscriptionUseCaseError);

      await expect(
        useCase.execute({
          userId: 'user-123',
          action: 'invalid_action' as any,
        })
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('should throw VALIDATION_ERROR for missing action', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          action: '' as any,
        })
      ).rejects.toThrow(UpdateSubscriptionUseCaseError);
    });
  });

  describe('subscription status mapping', () => {
    it('should map active status to subscribed', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue({
        ...mockSubscription,
        status: 'active',
      });
      scheduleSubscriptionCancellation.mockResolvedValue({
        ...mockSubscription,
        status: 'active',
        cancel_at_period_end: true,
      });

      await useCase.execute({
        userId: 'user-123',
        action: 'cancel_at_period_end',
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'subscribed',
        'cus_123',
        'sub_123'
      );
    });

    it('should map trialing status to subscribed', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);
      scheduleSubscriptionCancellation.mockResolvedValue({
        ...mockSubscription,
        status: 'trialing',
      });

      await useCase.execute({
        userId: 'user-123',
        action: 'cancel_at_period_end',
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'subscribed',
        'cus_123',
        'sub_123'
      );
    });

    it('should map past_due status correctly', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);
      scheduleSubscriptionCancellation.mockResolvedValue({
        ...mockSubscription,
        status: 'past_due',
      });

      await useCase.execute({
        userId: 'user-123',
        action: 'cancel_at_period_end',
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'past_due',
        'cus_123',
        'sub_123'
      );
    });

    it('should map canceled status correctly', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);
      cancelSubscription.mockResolvedValue({
        ...mockSubscription,
        status: 'canceled',
      });

      await useCase.execute({
        userId: 'user-123',
        action: 'cancel_immediately',
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'canceled',
        'cus_123',
        'sub_123'
      );
    });

    it('should map unpaid status to canceled', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);
      cancelSubscription.mockResolvedValue({
        ...mockSubscription,
        status: 'unpaid',
      });

      await useCase.execute({
        userId: 'user-123',
        action: 'cancel_immediately',
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'canceled',
        'cus_123',
        'sub_123'
      );
    });
  });

  describe('error handling', () => {
    it('should throw STRIPE_ERROR when getSubscription fails', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockRejectedValue(new Error('Stripe API error'));

      await expect(
        useCase.execute({
          userId: 'user-123',
          action: 'cancel_immediately',
        })
      ).rejects.toThrow(UpdateSubscriptionUseCaseError);

      await expect(
        useCase.execute({
          userId: 'user-123',
          action: 'cancel_immediately',
        })
      ).rejects.toMatchObject({
        code: 'STRIPE_ERROR',
        message: expect.stringContaining('Failed to retrieve subscription'),
      });
    });

    it('should throw STRIPE_ERROR when action fails', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);
      cancelSubscription.mockRejectedValue(new Error('Cancellation failed'));

      await expect(
        useCase.execute({
          userId: 'user-123',
          action: 'cancel_immediately',
        })
      ).rejects.toThrow(UpdateSubscriptionUseCaseError);

      await expect(
        useCase.execute({
          userId: 'user-123',
          action: 'cancel_immediately',
        })
      ).rejects.toMatchObject({
        code: 'STRIPE_ERROR',
        message: expect.stringContaining('Failed to update subscription'),
      });
    });

    it('should preserve UpdateSubscriptionUseCaseError in action handler', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);
      unscheduleSubscriptionCancellation.mockRejectedValue(
        new UpdateSubscriptionUseCaseError('Already active', 'INVALID_ACTION')
      );

      await expect(
        useCase.execute({
          userId: 'user-123',
          action: 'reactivate',
        })
      ).rejects.toMatchObject({
        code: 'INVALID_ACTION',
        message: 'Subscription is not scheduled for cancellation',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace in userId', async () => {
      await expect(
        useCase.execute({
          userId: '   ',
          action: 'cancel_immediately',
        })
      ).rejects.toThrow(UpdateSubscriptionUseCaseError);
    });

    it('should handle return value with all fields', async () => {
      const canceledTime = Math.floor(Date.now() / 1000);
      const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);
      cancelSubscription.mockResolvedValue({
        ...mockSubscription,
        status: 'canceled',
        cancel_at_period_end: true,
        canceled_at: canceledTime,
        current_period_end: periodEnd,
      });

      const result = await useCase.execute({
        userId: 'user-123',
        action: 'cancel_immediately',
      });

      expect(result).toEqual({
        subscriptionId: 'sub_123',
        status: 'canceled',
        currentPeriodEnd: new Date(periodEnd * 1000),
        cancelAtPeriodEnd: true,
        canceledAt: new Date(canceledTime * 1000),
      });
    });

    it('should handle null canceled_at', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      getSubscription.mockResolvedValue(mockSubscription);
      scheduleSubscriptionCancellation.mockResolvedValue({
        ...mockSubscription,
        cancel_at_period_end: true,
        canceled_at: null,
      });

      const result = await useCase.execute({
        userId: 'user-123',
        action: 'cancel_at_period_end',
      });

      expect(result.canceledAt).toBeNull();
    });
  });
});
