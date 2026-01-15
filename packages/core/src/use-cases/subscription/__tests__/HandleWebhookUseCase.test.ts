/**
 * Tests for HandleWebhookUseCase
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HandleWebhookUseCase,
  HandleWebhookUseCaseError,
  type HandleWebhookRequest,
} from '../HandleWebhookUseCase.js';
import type { UserRepository, User } from '../../../repositories/UserRepository.js';
import type Stripe from 'stripe';
import { createMockUser } from '../../../test-utils/mocks.js';

// Mock @anplexa/services/stripe
vi.mock('@anplexa/services/stripe', () => ({
  constructWebhookEvent: vi.fn(),
  handleCheckoutCompleted: vi.fn(),
  handleSubscriptionCreated: vi.fn(),
  handleSubscriptionUpdated: vi.fn(),
  handleSubscriptionDeleted: vi.fn(),
  handleInvoicePaid: vi.fn(),
  handleInvoicePaymentFailed: vi.fn(),
  isSubscriptionActive: vi.fn(),
  isSubscriptionCanceled: vi.fn(),
}));

import {
  constructWebhookEvent,
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
} from '@anplexa/services/stripe';

describe('HandleWebhookUseCase', () => {
  let useCase: HandleWebhookUseCase;
  let mockUserRepository: UserRepository;
  let mockUser: User;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock user using shared factory
    mockUser = createMockUser();

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
    useCase = new HandleWebhookUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should handle checkout.session.completed event', async () => {
      // Arrange
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: { userId: 'user-123' },
            client_reference_id: 'user-123',
            customer_details: { email: 'test@example.com' },
          },
        },
      } as Stripe.Event;

      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'sig_test',
      };

      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(handleCheckoutCompleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        email: 'test@example.com',
        metadata: { userId: 'user-123' },
      });
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        eventId: 'evt_123',
        eventType: 'checkout.session.completed',
        processed: true,
        userId: 'user-123',
      });

      expect(mockUserRepository.update).toHaveBeenCalledWith('user-123', {
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        subscriptionStatus: 'subscribed',
        updatedAt: expect.any(String),
      });
    });

    it('should handle customer.subscription.created event', async () => {
      // Arrange
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            metadata: { userId: 'user-123' },
            start_date: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
          },
        },
      } as Stripe.Event;

      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'sig_test',
      };

      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(handleSubscriptionCreated).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        status: 'active',
        isActive: true,
        startDate: new Date(),
        currentPeriodEnd: new Date(),
        metadata: { userId: 'user-123' },
      });
      vi.mocked(mockUserRepository.getByStripeCustomerId).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        eventId: 'evt_123',
        eventType: 'customer.subscription.created',
        processed: true,
        userId: 'user-123',
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'subscribed',
        'cus_123',
        'sub_123'
      );
    });

    it('should handle customer.subscription.updated event', async () => {
      // Arrange
      const userWithSub = { ...mockUser, stripeSubscriptionId: 'sub_123' };

      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            canceled_at: null,
            metadata: {},
          },
        },
      } as Stripe.Event;

      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'sig_test',
      };

      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(handleSubscriptionUpdated).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        status: 'active',
        isActive: true,
        isCanceled: false,
        canceledAt: null,
        metadata: {},
      });
      vi.mocked(mockUserRepository.getByStripeSubscriptionId).mockResolvedValue(userWithSub);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(userWithSub);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        eventId: 'evt_123',
        eventType: 'customer.subscription.updated',
        processed: true,
        userId: 'user-123',
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'subscribed',
        'cus_123',
        'sub_123'
      );
    });

    it('should handle customer.subscription.deleted event', async () => {
      // Arrange
      const userWithSub = { ...mockUser, stripeSubscriptionId: 'sub_123' };

      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            canceled_at: Math.floor(Date.now() / 1000),
            metadata: {},
          },
        },
      } as Stripe.Event;

      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'sig_test',
      };

      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(handleSubscriptionDeleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        canceledAt: new Date(),
        metadata: {},
      });
      vi.mocked(mockUserRepository.getByStripeSubscriptionId).mockResolvedValue(userWithSub);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(userWithSub);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        eventId: 'evt_123',
        eventType: 'customer.subscription.deleted',
        processed: true,
        userId: 'user-123',
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'canceled',
        'cus_123',
        'sub_123'
      );
    });

    it('should handle invoice.paid event', async () => {
      // Arrange
      const mockEvent = {
        id: 'evt_123',
        type: 'invoice.paid',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            amount_paid: 2000,
            currency: 'usd',
            status_transitions: {
              paid_at: Math.floor(Date.now() / 1000),
            },
            metadata: {},
          },
        },
      } as Stripe.Event;

      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'sig_test',
      };

      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(handleInvoicePaid).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        invoiceId: 'in_123',
        amountPaid: 2000,
        currency: 'usd',
        paidAt: new Date(),
        metadata: {},
      });
      vi.mocked(mockUserRepository.getByStripeCustomerId).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        eventId: 'evt_123',
        eventType: 'invoice.paid',
        processed: true,
        userId: 'user-123',
      });

      expect(mockUserRepository.update).toHaveBeenCalledWith('user-123', {
        updatedAt: expect.any(String),
      });
    });

    it('should handle invoice.payment_failed event', async () => {
      // Arrange
      const mockEvent = {
        id: 'evt_123',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            amount_due: 2000,
            currency: 'usd',
            next_payment_attempt: Math.floor(Date.now() / 1000) + 86400,
            metadata: {},
          },
        },
      } as Stripe.Event;

      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'sig_test',
      };

      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(handleInvoicePaymentFailed).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        invoiceId: 'in_123',
        amountDue: 2000,
        currency: 'usd',
        nextPaymentAttempt: new Date(Date.now() + 86400000),
        metadata: {},
      });
      vi.mocked(mockUserRepository.getByStripeCustomerId).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        eventId: 'evt_123',
        eventType: 'invoice.payment_failed',
        processed: true,
        userId: 'user-123',
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'past_due',
        'cus_123',
        'sub_123'
      );
    });

    it('should handle unsupported event types gracefully', async () => {
      // Arrange
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.created',
        data: {
          object: {},
        },
      } as Stripe.Event;

      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'sig_test',
      };

      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        eventId: 'evt_123',
        eventType: 'customer.created',
        processed: false,
        message: 'Unsupported event type: customer.created',
      });
    });

    it('should handle checkout completed without userId metadata', async () => {
      // Arrange
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: {},
            customer_details: { email: 'test@example.com' },
          },
        },
      } as Stripe.Event;

      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'sig_test',
      };

      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(handleCheckoutCompleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        email: 'test@example.com',
        metadata: {},
      });

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        eventId: 'evt_123',
        eventType: 'checkout.session.completed',
        processed: false,
        message: 'No userId found in checkout session metadata',
      });
    });

    it('should handle subscription created by finding user by metadata', async () => {
      // Arrange
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_unknown',
            status: 'active',
            metadata: { userId: 'user-123' },
            start_date: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
          },
        },
      } as Stripe.Event;

      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'sig_test',
      };

      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(handleSubscriptionCreated).mockReturnValue({
        customerId: 'cus_unknown',
        subscriptionId: 'sub_123',
        status: 'active',
        isActive: true,
        startDate: new Date(),
        currentPeriodEnd: new Date(),
        metadata: { userId: 'user-123' },
      });
      vi.mocked(mockUserRepository.getByStripeCustomerId).mockResolvedValue(null);
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        eventId: 'evt_123',
        eventType: 'customer.subscription.created',
        processed: true,
        userId: 'user-123',
      });
    });

    it('should handle subscription updated with past_due status', async () => {
      // Arrange
      const userWithSub = { ...mockUser, stripeSubscriptionId: 'sub_123' };

      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'past_due',
            canceled_at: null,
            metadata: {},
          },
        },
      } as Stripe.Event;

      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'sig_test',
      };

      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(handleSubscriptionUpdated).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        status: 'past_due',
        isActive: false,
        isCanceled: false,
        canceledAt: null,
        metadata: {},
      });
      vi.mocked(mockUserRepository.getByStripeSubscriptionId).mockResolvedValue(userWithSub);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(userWithSub);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'past_due',
        'cus_123',
        'sub_123'
      );
    });

    it('should handle invoice paid without subscription', async () => {
      // Arrange
      const mockEvent = {
        id: 'evt_123',
        type: 'invoice.paid',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
            subscription: null,
            amount_paid: 2000,
            currency: 'usd',
            status_transitions: {
              paid_at: Math.floor(Date.now() / 1000),
            },
            metadata: {},
          },
        },
      } as Stripe.Event;

      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'sig_test',
      };

      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(handleInvoicePaid).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: null,
        invoiceId: 'in_123',
        amountPaid: 2000,
        currency: 'usd',
        paidAt: new Date(),
        metadata: {},
      });

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toMatchObject({
        processed: false,
        message: 'Invoice is not related to a subscription',
      });
    });

    it('should throw error on invalid signature', async () => {
      // Arrange
      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'invalid_sig',
      };

      vi.mocked(constructWebhookEvent).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(HandleWebhookUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'INVALID_SIGNATURE',
      });
    });

    it('should throw error when user not found for checkout', async () => {
      // Arrange
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: { userId: 'user-123' },
            client_reference_id: 'user-123',
            customer_details: { email: 'test@example.com' },
          },
        },
      } as Stripe.Event;

      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'sig_test',
      };

      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(handleCheckoutCompleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        email: 'test@example.com',
        metadata: { userId: 'user-123' },
      });
      vi.mocked(mockUserRepository.getById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(HandleWebhookUseCaseError);
      await expect(useCase.execute(request)).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
      });
    });

    it('should handle duplicate webhook events idempotently', async () => {
      // Arrange - simulate receiving the same event twice
      const mockEvent = {
        id: 'evt_duplicate_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: { userId: 'user-123' },
            client_reference_id: 'user-123',
            customer_details: { email: 'test@example.com' },
          },
        },
      } as Stripe.Event;

      const request: HandleWebhookRequest = {
        payload: Buffer.from('test'),
        signature: 'sig_test',
      };

      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(handleCheckoutCompleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        email: 'test@example.com',
        metadata: { userId: 'user-123' },
      });
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser);

      // Act - Process the same event twice
      const result1 = await useCase.execute(request);
      const result2 = await useCase.execute(request);

      // Assert - Both calls should succeed without side effects from duplicates
      expect(result1.eventId).toBe('evt_duplicate_123');
      expect(result2.eventId).toBe('evt_duplicate_123');
      expect(result1.processed).toBe(true);
      expect(result2.processed).toBe(true);

      // The repository update should be called both times
      // (idempotency means the same result, not preventing the call)
      expect(mockUserRepository.update).toHaveBeenCalledTimes(2);

      // Both calls should update to the same state
      expect(mockUserRepository.update).toHaveBeenNthCalledWith(1, 'user-123', {
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        subscriptionStatus: 'subscribed',
        updatedAt: expect.any(String),
      });
      expect(mockUserRepository.update).toHaveBeenNthCalledWith(2, 'user-123', {
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        subscriptionStatus: 'subscribed',
        updatedAt: expect.any(String),
      });
    });
  });
});
