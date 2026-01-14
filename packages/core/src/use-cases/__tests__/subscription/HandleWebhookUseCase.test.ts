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
import type { IUserRepository } from '../../../repositories/interfaces/user.repository.interface';
import type { User } from '@anplexa/database';
import type Stripe from 'stripe';

// Create hoisted mocks to ensure they're applied before module imports
const { constructWebhookEvent, handleCheckoutCompleted, handleSubscriptionCreated, handleSubscriptionUpdated, handleSubscriptionDeleted, handleInvoicePaid, handleInvoicePaymentFailed, isSubscriptionActive, isSubscriptionCanceled } = vi.hoisted(() => ({
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

// Mock the Stripe webhook services BEFORE importing the use case
vi.mock('@anplexa/services/stripe', () => ({
  constructWebhookEvent,
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  isSubscriptionActive,
  isSubscriptionCanceled,
}));

// Import after mocking
import {
  HandleWebhookUseCase,
  HandleWebhookUseCaseError,
} from '../../subscription/HandleWebhookUseCase';

describe('HandleWebhookUseCase', () => {
  let useCase: HandleWebhookUseCase;
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

    // Reset all mocks
    vi.clearAllMocks();

    useCase = new HandleWebhookUseCase(mockUserRepository);
  });

  describe('webhook signature verification', () => {
    it('should throw INVALID_SIGNATURE error for invalid signature', async () => {
      constructWebhookEvent.mockImplementation(() => {
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        object: 'event',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: { userId: 'user-123' },
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleCheckoutCompleted.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        object: 'event',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: { userId: 'user-123' },
            client_reference_id: null,
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleCheckoutCompleted.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        object: 'event',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: {},
            client_reference_id: 'user-123',
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleCheckoutCompleted.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        object: 'event',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: null,
            metadata: {},
            client_reference_id: null,
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleCheckoutCompleted.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: null,
      });

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(false);
      expect(result.message).toContain('No userId found');
    });

    it('should handle checkout without subscription', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        object: 'event',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: null,
            metadata: { userId: 'user-123' },
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleCheckoutCompleted.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: null,
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        object: 'event',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: { userId: 'non-existent' },
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleCheckoutCompleted.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'customer.subscription.created',
        object: 'event',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            metadata: {},
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleSubscriptionCreated.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        isActive: true,
        isCanceled: false,
        status: 'active',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'customer.subscription.created',
        object: 'event',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_unknown',
            status: 'active',
            metadata: { userId: 'user-123' },
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleSubscriptionCreated.mockReturnValue({
        customerId: 'cus_unknown',
        subscriptionId: 'sub_123',
        isActive: true,
        isCanceled: false,
        status: 'active',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'customer.subscription.created',
        object: 'event',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_unknown',
            status: 'active',
            metadata: {},
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleSubscriptionCreated.mockReturnValue({
        customerId: 'cus_unknown',
        subscriptionId: 'sub_123',
        isActive: true,
        isCanceled: false,
        status: 'active',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'customer.subscription.created',
        object: 'event',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'incomplete',
            metadata: {},
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleSubscriptionCreated.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        isActive: false,
        isCanceled: false,
        status: 'incomplete',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'customer.subscription.updated',
        object: 'event',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleSubscriptionUpdated.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        isActive: true,
        isCanceled: false,
        status: 'active',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'customer.subscription.updated',
        object: 'event',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'past_due',
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleSubscriptionUpdated.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        isActive: false,
        isCanceled: false,
        status: 'past_due',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'customer.subscription.updated',
        object: 'event',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'canceled',
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleSubscriptionUpdated.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        isActive: false,
        isCanceled: true,
        status: 'canceled',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'customer.subscription.updated',
        object: 'event',
        data: {
          object: {
            id: 'sub_unknown',
            customer: 'cus_123',
            status: 'active',
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleSubscriptionUpdated.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_unknown',
        isActive: true,
        isCanceled: false,
        status: 'active',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'customer.subscription.deleted',
        object: 'event',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'canceled',
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleSubscriptionDeleted.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'customer.subscription.deleted',
        object: 'event',
        data: {
          object: {
            id: 'sub_unknown',
            customer: 'cus_123',
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleSubscriptionDeleted.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_unknown',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'invoice.paid',
        object: 'event',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            amount_paid: 999,
            currency: 'usd',
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleInvoicePaid.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        amountPaid: 999,
        currency: 'usd',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'invoice.paid',
        object: 'event',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
            subscription: null,
            amount_paid: 999,
            currency: 'usd',
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleInvoicePaid.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: null,
        amountPaid: 999,
        currency: 'usd',
      });

      const result = await useCase.execute({
        payload: Buffer.from('{}'),
        signature: 'valid-sig',
      });

      expect(result.processed).toBe(false);
      expect(result.message).toContain('not related to a subscription');
    });

    it('should handle user not found for invoice', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'invoice.paid',
        object: 'event',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_unknown',
            subscription: 'sub_123',
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleInvoicePaid.mockReturnValue({
        customerId: 'cus_unknown',
        subscriptionId: 'sub_123',
        amountPaid: 999,
        currency: 'usd',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'invoice.payment_failed',
        object: 'event',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            amount_due: 999,
            currency: 'usd',
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleInvoicePaymentFailed.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        amountDue: 999,
        currency: 'usd',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'invoice.payment_failed',
        object: 'event',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
            subscription: null,
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleInvoicePaymentFailed.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: null,
        amountDue: 999,
        currency: 'usd',
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'customer.created',
        object: 'event',
        data: {
          object: {} as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);

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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        object: 'event',
        data: {
          object: {
            metadata: { userId: 'user-123' },
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleCheckoutCompleted.mockImplementation(() => {
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
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        object: 'event',
        data: {
          object: {
            metadata: { userId: 'user-123' },
          } as any,
        },
      } as any;

      constructWebhookEvent.mockReturnValue(mockEvent);
      handleCheckoutCompleted.mockReturnValue({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
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
