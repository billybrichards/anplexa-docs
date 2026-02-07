/**
 * HandleWebhookUseCase Tests
 *
 * Tests the Stripe webhook processing logic including:
 * - Webhook signature verification
 * - Event routing
 * - Checkout session completion
 * - Subscription lifecycle events
 * - Invoice events
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IUserRepository } from '../../../repositories/interfaces/user.repository.interface.js';
import type { User } from '@anplexa/database';
import type { IStripeService } from '../../../domain/services/IStripeService.js';

import {
  HandleWebhookUseCase,
  HandleWebhookUseCaseError,
} from '../../subscription/HandleWebhookUseCase.js';

describe('HandleWebhookUseCase', () => {
  let useCase: HandleWebhookUseCase;
  let mockUserRepository: IUserRepository;
  let mockStripeService: IStripeService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    displayName: 'Test User',
    chatName: null,
    personalityMode: null,
    storagePreference: null,
    isAdmin: false,
    subscriptionStatus: 'not_subscribed',
    credits: 100,
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: null,
    accountSource: 'direct',
    sourceChannel: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

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

    // Reset all mocks
    vi.clearAllMocks();

    useCase = new HandleWebhookUseCase(mockUserRepository, mockStripeService);
  });

  describe('webhook signature verification', () => {
    it('should throw INVALID_SIGNATURE error for invalid signature', async () => {
      vi.mocked(mockStripeService.constructWebhookEvent).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        useCase.execute({
          payload: Buffer.from('{}'),
          signature: 'invalid-signature',
        })
      ).rejects.toThrow(HandleWebhookUseCaseError);

      await expect(
        useCase.execute({
          payload: Buffer.from('{}'),
          signature: 'invalid-signature',
        })
      ).rejects.toMatchObject({
        code: 'INVALID_SIGNATURE',
        message: expect.stringContaining('Webhook signature verification failed'),
      });
    });

    it('should accept valid signature', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: { userId: 'user-123' },
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleCheckoutCompleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        email: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-signature',
      });

      expect(result.processed).toBe(true);
      expect(result.eventId).toBe('evt_123');
      expect(result.eventType).toBe('checkout.session.completed');
    });
  });

  describe('checkout.session.completed', () => {
    it('should process checkout completion with userId in metadata', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: { userId: 'user-123' },
            client_reference_id: null,
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleCheckoutCompleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        email: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
          subscriptionStatus: 'subscribed',
        })
      );
    });

    it('should process checkout completion with userId in client_reference_id', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: {},
            client_reference_id: 'user-123',
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleCheckoutCompleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        email: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(true);
      expect(result.userId).toBe('user-123');
    });

    it('should handle checkout without userId', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: null,
            metadata: {},
            client_reference_id: null,
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleCheckoutCompleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: null,
        email: null,
        metadata: null,
      });

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(false);
      expect(result.message).toContain('No userId found');
    });

    it('should handle checkout without subscription', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: null,
            metadata: { userId: 'user-123' },
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleCheckoutCompleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: null,
        email: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          subscriptionStatus: 'not_subscribed',
        })
      );
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: { userId: 'non-existent' },
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleCheckoutCompleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        email: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getById).mockResolvedValue(null);

      await expect(
        useCase.execute({
          payload: Buffer.from('{}'),
          signature: 'valid-sig',
        })
      ).rejects.toThrow(HandleWebhookUseCaseError);

      await expect(
        useCase.execute({
          payload: Buffer.from('{}'),
          signature: 'valid-sig',
        })
      ).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('customer.subscription.created', () => {
    it('should process subscription creation by customer ID', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            metadata: {},
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleSubscriptionCreated).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        isActive: true,
        isCanceled: false,
        status: 'active',
        canceledAt: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getByStripeCustomerId).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(undefined);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'subscribed',
        'cus_123',
        'sub_123'
      );
    });

    it('should process subscription creation by metadata userId', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_unknown',
            status: 'active',
            metadata: { userId: 'user-123' },
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleSubscriptionCreated).mockReturnValue({
        customerId: 'cus_unknown',
        subscriptionId: 'sub_123',
        isActive: true,
        isCanceled: false,
        status: 'active',
        canceledAt: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getByStripeCustomerId).mockResolvedValue(null);
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(undefined);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(true);
      expect(result.userId).toBe('user-123');
    });

    it('should handle subscription creation when user not found', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_unknown',
            status: 'active',
            metadata: {},
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleSubscriptionCreated).mockReturnValue({
        customerId: 'cus_unknown',
        subscriptionId: 'sub_123',
        isActive: true,
        isCanceled: false,
        status: 'active',
        canceledAt: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getByStripeCustomerId).mockResolvedValue(null);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(false);
      expect(result.message).toContain('No user found');
    });

    it('should set not_subscribed status for inactive subscription', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'incomplete',
            metadata: {},
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleSubscriptionCreated).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        isActive: false,
        isCanceled: false,
        status: 'incomplete',
        canceledAt: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getByStripeCustomerId).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(undefined);

      await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'not_subscribed',
        'cus_123',
        'sub_123'
      );
    });
  });

  describe('customer.subscription.updated', () => {
    it('should process subscription update to active status', async () => {
      const userWithSub = { ...mockUser, stripeSubscriptionId: 'sub_123' };
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleSubscriptionUpdated).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        isActive: true,
        isCanceled: false,
        status: 'active',
        canceledAt: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getByStripeSubscriptionId).mockResolvedValue(userWithSub);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(undefined);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(true);
      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'subscribed',
        'cus_123',
        'sub_123'
      );
    });

    it('should handle past_due status', async () => {
      const userWithSub = { ...mockUser, stripeSubscriptionId: 'sub_123' };
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'past_due',
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleSubscriptionUpdated).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        isActive: false,
        isCanceled: false,
        status: 'past_due',
        canceledAt: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getByStripeSubscriptionId).mockResolvedValue(userWithSub);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(undefined);

      await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'past_due',
        'cus_123',
        'sub_123'
      );
    });

    it('should handle canceled status', async () => {
      const userWithSub = { ...mockUser, stripeSubscriptionId: 'sub_123' };
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'canceled',
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleSubscriptionUpdated).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        isActive: false,
        isCanceled: true,
        status: 'canceled',
        canceledAt: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getByStripeSubscriptionId).mockResolvedValue(userWithSub);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(undefined);

      await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'canceled',
        'cus_123',
        'sub_123'
      );
    });

    it('should handle user not found for subscription update', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_unknown',
            customer: 'cus_123',
            status: 'active',
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleSubscriptionUpdated).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_unknown',
        isActive: true,
        isCanceled: false,
        status: 'active',
        canceledAt: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getByStripeSubscriptionId).mockResolvedValue(null);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(false);
      expect(result.message).toContain('No user found');
    });
  });

  describe('customer.subscription.deleted', () => {
    it('should process subscription deletion', async () => {
      const userWithSub = { ...mockUser, stripeSubscriptionId: 'sub_123' };
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'canceled',
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleSubscriptionDeleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        status: 'canceled',
        isActive: false,
        canceledAt: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getByStripeSubscriptionId).mockResolvedValue(userWithSub);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(undefined);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(true);
      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'canceled',
        'cus_123',
        'sub_123'
      );
    });

    it('should handle user not found for subscription deletion', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_unknown',
            customer: 'cus_123',
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleSubscriptionDeleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_unknown',
        status: 'canceled',
        isActive: false,
        canceledAt: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getByStripeSubscriptionId).mockResolvedValue(null);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(false);
    });
  });

  describe('invoice.paid', () => {
    it('should process invoice payment for subscription', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'invoice.paid',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            amount_paid: 999,
            currency: 'usd',
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleInvoicePaid).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        invoiceId: 'in_123',
        amountPaid: 999,
        currency: 'usd',
        metadata: null,
      });
      vi.mocked(mockUserRepository.getByStripeCustomerId).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          updatedAt: expect.any(String),
        })
      );
    });

    it('should skip non-subscription invoices', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'invoice.paid',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
            subscription: null,
            amount_paid: 999,
            currency: 'usd',
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleInvoicePaid).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: null,
        invoiceId: 'in_123',
        amountPaid: 999,
        currency: 'usd',
        metadata: null,
      });

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(false);
      expect(result.message).toContain('not related to a subscription');
    });

    it('should handle user not found for invoice', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'invoice.paid',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_unknown',
            subscription: 'sub_123',
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleInvoicePaid).mockReturnValue({
        customerId: 'cus_unknown',
        subscriptionId: 'sub_123',
        invoiceId: 'in_123',
        amountPaid: 999,
        currency: 'usd',
        metadata: null,
      });
      vi.mocked(mockUserRepository.getByStripeCustomerId).mockResolvedValue(null);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(false);
    });
  });

  describe('invoice.payment_failed', () => {
    it('should process failed invoice payment', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            amount_due: 999,
            currency: 'usd',
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleInvoicePaymentFailed).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        invoiceId: 'in_123',
        amountDue: 999,
        currency: 'usd',
        metadata: null,
      });
      vi.mocked(mockUserRepository.getByStripeCustomerId).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.updateSubscriptionStatus).mockResolvedValue(undefined);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(true);
      expect(mockUserRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'user-123',
        'past_due',
        'cus_123',
        'sub_123'
      );
    });

    it('should skip non-subscription failed invoices', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
            subscription: null,
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleInvoicePaymentFailed).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: null,
        invoiceId: 'in_123',
        amountDue: 999,
        currency: 'usd',
        metadata: null,
      });

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(false);
    });
  });

  describe('unsupported events', () => {
    it('should handle unsupported event types gracefully', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.created',
        data: {
          object: {},
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(false);
      expect(result.eventType).toBe('customer.created');
      expect(result.message).toContain('Unsupported event type');
    });
  });

  describe('error handling', () => {
    it('should handle processing errors', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { userId: 'user-123' },
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleCheckoutCompleted).mockImplementation(() => {
        throw new Error('Processing failed');
      });

      await expect(
        useCase.execute({
          payload: Buffer.from('{}'),
          signature: 'valid-sig',
        })
      ).rejects.toThrow(HandleWebhookUseCaseError);

      await expect(
        useCase.execute({
          payload: Buffer.from('{}'),
          signature: 'valid-sig',
        })
      ).rejects.toMatchObject({
        code: 'PROCESSING_ERROR',
        message: expect.stringContaining('Failed to process webhook event'),
      });
    });

    it('should preserve HandleWebhookUseCaseError in event routing', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { userId: 'user-123' },
          },
        },
      };

      vi.mocked(mockStripeService.constructWebhookEvent).mockReturnValue(mockEvent);
      vi.mocked(mockStripeService.handleCheckoutCompleted).mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        email: null,
        metadata: null,
      });
      vi.mocked(mockUserRepository.getById).mockResolvedValue(null);

      await expect(
        useCase.execute({
          payload: Buffer.from('{}'),
          signature: 'valid-sig',
        })
      ).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
      });
    });
  });
});
