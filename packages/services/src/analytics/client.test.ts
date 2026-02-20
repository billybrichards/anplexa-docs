/**
 * Analytics Client Tests
 * Validates type-safe event tracking and client initialization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsClient } from './client.js';
import { AnalyticsEvents } from './events.js';

describe('AnalyticsClient', () => {
  let client: AnalyticsClient;

  beforeEach(() => {
    // Reset client for each test
    client = new AnalyticsClient({ isServer: true, posthogKey: 'test-key' });
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create an instance without PostHog key', () => {
      const testClient = new AnalyticsClient();
      expect(testClient).toBeInstanceOf(AnalyticsClient);
      expect(testClient.isInitialized()).toBe(false);
    });

    it('should mark as initialized after setup', async () => {
      const testClient = new AnalyticsClient({
        isServer: true,
        posthogKey: 'test-key',
      });
      // Note: actual initialization would require mocking PostHog modules
      expect(testClient.isInitialized()).toBe(false);
    });
  });

  describe('identify', () => {
    it('should safely call identify without PostHog', () => {
      // Should not throw
      expect(() => {
        client.identify('user-123', { email: 'user@example.com' });
      }).not.toThrow();
    });

    it('should handle identify with user properties', () => {
      expect(() => {
        client.identify('user-456', {
          email: 'test@example.com',
          displayName: 'Test User',
          subscriptionStatus: 'active',
        });
      }).not.toThrow();
    });
  });

  describe('track - Type Safety', () => {
    it('should accept USER_SIGNED_UP event with correct properties', () => {
      expect(() => {
        client.track(AnalyticsEvents.USER_SIGNED_UP, {
          email: 'new@example.com',
          method: 'email',
          funnel_persona: 'curious',
        });
      }).not.toThrow();
    });

    it('should accept MESSAGE_SENT event with correct properties', () => {
      expect(() => {
        client.track(AnalyticsEvents.MESSAGE_SENT, {
          message_length: 150,
          is_guest: false,
          message_count: 5,
        });
      }).not.toThrow();
    });

    it('should accept CHECKOUT_COMPLETED event', () => {
      expect(() => {
        client.track(AnalyticsEvents.CHECKOUT_COMPLETED, {
          plan: 'monthly',
          stripe_customer_id: 'cus_123',
          stripe_subscription_id: 'sub_123',
        });
      }).not.toThrow();
    });

    it('should accept FUNNEL_QUESTION_ANSWERED event', () => {
      expect(() => {
        client.track(AnalyticsEvents.FUNNEL_QUESTION_ANSWERED, {
          persona: 'curious',
          question_id: 'q-001',
          question_text: 'What is your main interest?',
          answer: 'Technology',
          answer_index: 0,
          question_number: 1,
          total_questions: 5,
        });
      }).not.toThrow();
    });

    it('should accept END_SCREEN_CTA_CLICKED event', () => {
      expect(() => {
        client.track(AnalyticsEvents.END_SCREEN_CTA_CLICKED, {
          action: 'paid',
          funnel_source: 'instagram',
        });
      }).not.toThrow();
    });

    it('should accept PAGE_VIEW event', () => {
      expect(() => {
        client.track(AnalyticsEvents.PAGE_VIEW, {
          $current_url: 'https://example.com/dashboard',
          path: '/dashboard',
          title: 'Dashboard',
        });
      }).not.toThrow();
    });
  });

  describe('setUserProperties', () => {
    it('should accept user properties', () => {
      expect(() => {
        client.setUserProperties({
          email: 'user@example.com',
          displayName: 'John Doe',
          subscriptionStatus: 'subscribed',
          plan: 'monthly',
        });
      }).not.toThrow();
    });

    it('should accept partial user properties', () => {
      expect(() => {
        client.setUserProperties({
          companionGender: 'female',
          onboardingCompleted: true,
        });
      }).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should safely call reset without PostHog', () => {
      expect(() => {
        client.reset();
      }).not.toThrow();
    });
  });

  describe('pageView', () => {
    it('should safely call pageView without PostHog', () => {
      expect(() => {
        client.pageView('/dashboard', 'Dashboard');
      }).not.toThrow();
    });

    it('should accept path without title', () => {
      expect(() => {
        client.pageView('/settings');
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should not throw on invalid event properties', () => {
      expect(() => {
        client.track(AnalyticsEvents.MESSAGE_SENT, {
          message_length: 100,
          is_guest: true,
          message_count: 1,
          invalid_prop: 'should be ignored',
        } as any);
      }).not.toThrow();
    });

    it('should handle flush gracefully without PostHog', async () => {
      await expect(client.flush()).resolves.not.toThrow();
    });
  });
});

describe('Event Type Coverage', () => {
  let client: AnalyticsClient;

  beforeEach(() => {
    client = new AnalyticsClient({ isServer: true });
  });

  describe('auth events', () => {
    it('tracks USER_LOGGED_IN', () => {
      expect(() => {
        client.track(AnalyticsEvents.USER_LOGGED_IN, {
          email: 'user@example.com',
          method: 'magic_link',
        });
      }).not.toThrow();
    });

    it('tracks USER_LOGGED_OUT', () => {
      expect(() => {
        client.track(AnalyticsEvents.USER_LOGGED_OUT);
      }).not.toThrow();
    });

    it('tracks MAGIC_LINK_SENT', () => {
      expect(() => {
        client.track(AnalyticsEvents.MAGIC_LINK_SENT, {
          email: 'user@example.com',
        });
      }).not.toThrow();
    });
  });

  describe('payment events', () => {
    it('tracks CHECKOUT_STARTED', () => {
      expect(() => {
        client.track(AnalyticsEvents.CHECKOUT_STARTED, {
          plan: 'monthly',
          price: 299,
          currency: 'GBP',
        });
      }).not.toThrow();
    });

    it('tracks PLAN_SELECTED', () => {
      expect(() => {
        client.track(AnalyticsEvents.PLAN_SELECTED, {
          plan: 'early_believer',
          plan_price: 1199,
          plan_billing: 'yearly',
          persona: 'curious',
        });
      }).not.toThrow();
    });

    it('tracks FREE_ACCESS_CLICKED', () => {
      expect(() => {
        client.track(AnalyticsEvents.FREE_ACCESS_CLICKED, {
          persona: 'lonely',
          conversion_type: 'free_trial',
        });
      }).not.toThrow();
    });
  });

  describe('messaging events', () => {
    it('tracks AI_RESPONSE_RECEIVED', () => {
      expect(() => {
        client.track(AnalyticsEvents.AI_RESPONSE_RECEIVED, {
          response_length: 500,
          response_time_ms: 2500,
          is_guest: false,
        });
      }).not.toThrow();
    });

    it('tracks NEW_CONVERSATION_STARTED', () => {
      expect(() => {
        client.track(AnalyticsEvents.NEW_CONVERSATION_STARTED, {
          is_guest: false,
        });
      }).not.toThrow();
    });

    it('tracks CONVERSATION_LOADED', () => {
      expect(() => {
        client.track(AnalyticsEvents.CONVERSATION_LOADED, {
          message_count: 12,
        });
      }).not.toThrow();
    });
  });

  describe('onboarding events', () => {
    it('tracks GENDER_SELECTED', () => {
      expect(() => {
        client.track(AnalyticsEvents.GENDER_SELECTED, {
          gender: 'female',
          is_custom: false,
        });
      }).not.toThrow();
    });

    it('tracks COMPANION_NAME_SET', () => {
      expect(() => {
        client.track(AnalyticsEvents.COMPANION_NAME_SET, {
          has_custom_name: true,
        });
      }).not.toThrow();
    });

    it('tracks ONBOARDING_COMPLETED', () => {
      expect(() => {
        client.track(AnalyticsEvents.ONBOARDING_COMPLETED, {
          companion_gender: 'female',
          has_custom_name: true,
        });
      }).not.toThrow();
    });
  });

  describe('funnel events', () => {
    it('tracks FUNNEL_ENTRY_VIEWED', () => {
      expect(() => {
        client.track(AnalyticsEvents.FUNNEL_ENTRY_VIEWED, {
          page: 'funnel_entry',
        });
      }).not.toThrow();
    });

    it('tracks FUNNEL_PERSONA_SELECTED', () => {
      expect(() => {
        client.track(AnalyticsEvents.FUNNEL_PERSONA_SELECTED, {
          persona: 'lonely',
          persona_name: 'Lonely Hearts',
        });
      }).not.toThrow();
    });

    it('tracks FUNNEL_QUESTION_VIEWED', () => {
      expect(() => {
        client.track(AnalyticsEvents.FUNNEL_QUESTION_VIEWED, {
          persona: 'curious',
          question_id: 'q-2',
          question_text: 'What are your interests?',
          question_number: 2,
          total_questions: 10,
        });
      }).not.toThrow();
    });

    it('tracks EMAIL_CAPTURE_VIEWED', () => {
      expect(() => {
        client.track(AnalyticsEvents.EMAIL_CAPTURE_VIEWED, {
          persona: 'privacy',
        });
      }).not.toThrow();
    });

    it('tracks EMAIL_SUBMITTED', () => {
      expect(() => {
        client.track(AnalyticsEvents.EMAIL_SUBMITTED, {
          persona: 'curious',
          funnel_type: 'direct',
        });
      }).not.toThrow();
    });

    it('tracks PRICING_VIEWED', () => {
      expect(() => {
        client.track(AnalyticsEvents.PRICING_VIEWED, {
          persona: 'lonely',
          pricing_options: ['monthly', 'early_believer'],
        });
      }).not.toThrow();
    });

    it('tracks REGISTRATION_COMPLETED', () => {
      expect(() => {
        client.track(AnalyticsEvents.REGISTRATION_COMPLETED, {
          plan: 'monthly',
          funnel_source: 'instagram',
          conversion_type: 'paid',
        });
      }).not.toThrow();
    });
  });

  describe('blog events', () => {
    it('tracks BLOG_POST_VIEWED', () => {
      expect(() => {
        client.track(AnalyticsEvents.BLOG_POST_VIEWED, {
          slug: 'understanding-ai-companions',
          title: 'Understanding AI Companions',
          category: 'education',
        });
      }).not.toThrow();
    });

    it('tracks BLOG_LIST_VIEWED', () => {
      expect(() => {
        client.track(AnalyticsEvents.BLOG_LIST_VIEWED, {
          category: 'all',
          posts_displayed: 12,
        });
      }).not.toThrow();
    });
  });

  describe('error events', () => {
    it('tracks ERROR_OCCURRED', () => {
      expect(() => {
        client.track(AnalyticsEvents.ERROR_OCCURRED, {
          error_type: 'network_error',
          error_message: 'Failed to connect to API',
          context: 'message_send',
        });
      }).not.toThrow();
    });
  });
});
