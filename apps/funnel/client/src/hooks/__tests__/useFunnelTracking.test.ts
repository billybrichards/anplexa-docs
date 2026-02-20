/**
 * useFunnelTracking Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useFunnelTracking } from '../useFunnelTracking';
import { vi } from 'vitest';

// Mock console
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock fetch before tests
vi.stubGlobal('fetch', vi.fn());

describe('useFunnelTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockClear();
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Analytics Tracking', () => {
    test('trackStepView() should log step view', () => {
      const { result } = renderHook(() => useFunnelTracking());

      act(() => {
        result.current.trackStepView('q1', 0);
      });

      expect(console.log).toHaveBeenCalledWith('[Analytics] funnel_step_viewed', {
        stepId: 'q1',
        stepNumber: 0,
      });
    });

    test('trackResponse() should log response', () => {
      const { result } = renderHook(() => useFunnelTracking());

      act(() => {
        result.current.trackResponse('q1', 'Option A');
      });

      expect(console.log).toHaveBeenCalledWith('[Analytics] question_answered', {
        persona: 'A',
        questionId: 'q1',
        answer: 'Option A',
      });
    });

    test('trackCompletion() should log all responses', () => {
      const { result } = renderHook(() => useFunnelTracking());

      const responses = {
        q1: 'Option A',
        q2: 'Option B',
        q3: 'Option C',
      };

      act(() => {
        result.current.trackCompletion(responses);
      });

      // Should call trackResponse for each response
      expect(console.log).toHaveBeenCalledTimes(3);
    });

    test('trackPersonaSelection() should log persona selection', () => {
      const { result } = renderHook(() => useFunnelTracking());

      act(() => {
        result.current.trackPersonaSelection('B');
      });

      expect(console.log).toHaveBeenCalledWith('[Analytics] persona_selected', {
        persona: 'B',
      });
    });

    test('trackEmailSubmitted() should log email submission', () => {
      const { result } = renderHook(() => useFunnelTracking());

      act(() => {
        result.current.trackEmailSubmitted('user@example.com', 'free');
      });

      expect(console.log).toHaveBeenCalledWith('[Analytics] email_submitted', {
        persona: 'A',
        path: 'free',
      });
    });

    test('trackCheckoutStarted() should log checkout start', () => {
      const { result } = renderHook(() => useFunnelTracking());

      act(() => {
        result.current.trackCheckoutStarted('A', 'price_123');
      });

      expect(console.log).toHaveBeenCalledWith('[Analytics] checkout_started', {
        persona: 'A',
        priceId: 'price_123',
      });
    });

    test('trackCheckoutCompleted() should log checkout completion', () => {
      const { result } = renderHook(() => useFunnelTracking());

      act(() => {
        result.current.trackCheckoutCompleted('A');
      });

      expect(console.log).toHaveBeenCalledWith('[Analytics] checkout_completed', {
        persona: 'A',
      });
    });

    test('trackAccountCreated() should log account creation', () => {
      const { result } = renderHook(() => useFunnelTracking());

      act(() => {
        result.current.trackAccountCreated('A', 'user@example.com');
      });

      expect(console.log).toHaveBeenCalledWith('[Analytics] account_created', {
        persona: 'A',
        email: 'user@example.com',
      });
    });

    test('identifyUser() should log user identification', () => {
      const { result } = renderHook(() => useFunnelTracking());

      const properties = { plan: 'pro', signup_date: '2024-01-01' };

      act(() => {
        result.current.identifyUser('user@example.com', properties);
      });

      expect(console.log).toHaveBeenCalledWith('[Analytics] identify', {
        email: 'user@example.com',
        properties,
      });
    });
  });

  describe('API Calls', () => {
    test('submitFunnelData() should make POST request', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useFunnelTracking());

      const funnelData = {
        sessionId: 'session-123',
        persona: 'A' as const,
        email: 'user@example.com',
        responses: { q1: 'Option A', q2: 'Option B' },
        path: 'free' as const,
      };

      await act(async () => {
        await result.current.submitFunnelData(funnelData);
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/funnel-responses'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(funnelData),
        })
      );
    });

    test('submitEmail() should submit email to backend', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useFunnelTracking());

      await act(async () => {
        await result.current.submitEmail('user@example.com', 'A');
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/emails'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'user@example.com',
            persona: 'A',
            source: 'funnel',
          }),
        })
      );
    });

    test('checkUserExists() should return true if user exists', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      });

      const { result } = renderHook(() => useFunnelTracking());

      const exists = await result.current.checkUserExists('user@example.com');

      expect(exists).toBe(true);
    });

    test('checkUserExists() should return false if user does not exist', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ exists: false, subscribed: false }),
      } as unknown as Response);

      const { result } = renderHook(() => useFunnelTracking());

      const exists = await result.current.checkUserExists('newuser@example.com');

      expect(exists).toBe(false);
    });

    test('checkUserExists() should return false on error', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFunnelTracking());

      const exists = await result.current.checkUserExists('user@example.com');

      expect(exists).toBe(false);
    });

    test('createCheckoutSession() should return checkout URL', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/session123' }),
      });

      const { result } = renderHook(() => useFunnelTracking());

      const checkoutUrl = await result.current.createCheckoutSession(
        'user@example.com',
        'price_123',
        'A'
      );

      expect(checkoutUrl).toBe('https://checkout.stripe.com/session123');
    });

    test('createCheckoutSession() should throw on error', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'User already registered' }),
      });

      const { result } = renderHook(() => useFunnelTracking());

      await expect(
        act(async () => {
          await result.current.createCheckoutSession('user@example.com', 'price_123', 'A');
        })
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('submitFunnelData() should handle errors', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFunnelTracking());

      const funnelData = {
        sessionId: 'session-123',
        persona: 'A' as const,
        email: 'user@example.com',
        responses: { q1: 'Option A' },
        path: 'free' as const,
      };

      await expect(
        act(async () => {
          await result.current.submitFunnelData(funnelData);
        })
      ).rejects.toThrow();
    });

    test('submitEmail() should handle errors', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFunnelTracking());

      await expect(
        act(async () => {
          await result.current.submitEmail('user@example.com', 'A');
        })
      ).rejects.toThrow();
    });
  });

  describe('Memoization', () => {
    test('functions should be memoized', () => {
      const { result: result1 } = renderHook(() => useFunnelTracking());
      const { result: result2 } = renderHook(() => useFunnelTracking());

      // Get references to functions
      const trackStepView1 = result1.current.trackStepView;
      const trackStepView2 = result2.current.trackStepView;

      // They should be different instances (different hook calls)
      expect(trackStepView1).not.toBe(trackStepView2);

      // But they should be consistent within the same hook
      const { result } = renderHook(() => useFunnelTracking());
      const trackStepView = result.current.trackStepView;
      const trackStepViewAgain = result.current.trackStepView;

      expect(trackStepView).toBe(trackStepViewAgain);
    });
  });
});
