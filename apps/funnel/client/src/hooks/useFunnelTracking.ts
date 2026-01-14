/**
 * useFunnelTracking Hook
 *
 * Handles analytics tracking (PostHog events), conversion tracking,
 * backend API calls, and Stripe integration.
 */

import { useCallback } from 'react';
import type { FunnelResponse, Persona } from '../types';

export interface UseFunnelTrackingReturn {
  trackStepView: (stepId: string, stepNumber?: number) => void;
  trackResponse: (stepId: string, response: any) => void;
  trackCompletion: (responses: Record<string, any>) => void;
  trackPersonaSelection: (persona: Persona) => void;
  trackEmailSubmitted: (email: string, path: 'free' | 'paid') => void;
  trackCheckoutStarted: (persona: Persona, priceId: string) => void;
  trackCheckoutCompleted: (persona: Persona) => void;
  trackAccountCreated: (persona: Persona, email: string) => void;
  submitFunnelData: (data: FunnelResponse) => Promise<void>;
  submitEmail: (email: string, persona: Persona) => Promise<void>;
  checkUserExists: (email: string) => Promise<boolean>;
  createCheckoutSession: (email: string, priceId: string, persona: Persona) => Promise<string>;
  identifyUser: (email: string, properties: Record<string, any>) => void;
}

// Analytics tracking functions (PostHog integration)
const trackAnalytics = {
  funnelStart: () => {
    // TODO: posthog.capture('funnel_start');
    console.log('[Analytics] funnel_start');
  },
  personaSelected: (persona: Persona) => {
    // TODO: posthog.capture('persona_selected', { persona });
    console.log('[Analytics] persona_selected', { persona });
  },
  questionAnswered: (persona: Persona, questionId: string, answer: string) => {
    // TODO: posthog.capture('question_answered', { persona, questionId, answer });
    console.log('[Analytics] question_answered', { persona, questionId, answer });
  },
  stepViewed: (stepId: string, stepNumber?: number) => {
    // TODO: posthog.capture('funnel_step_viewed', { stepId, stepNumber });
    console.log('[Analytics] funnel_step_viewed', { stepId, stepNumber });
  },
  emailSubmitted: (persona: Persona, path: 'free' | 'paid') => {
    // TODO: posthog.capture('email_submitted', { persona, path });
    console.log('[Analytics] email_submitted', { persona, path });
  },
  checkoutStarted: (persona: Persona, priceId: string) => {
    // TODO: posthog.capture('checkout_started', { persona, priceId });
    console.log('[Analytics] checkout_started', { persona, priceId });
  },
  checkoutCompleted: (persona: Persona) => {
    // TODO: posthog.capture('checkout_completed', { persona });
    console.log('[Analytics] checkout_completed', { persona });
  },
  accountCreated: (persona: Persona, email: string) => {
    // TODO: posthog.capture('account_created', { persona, email });
    console.log('[Analytics] account_created', { persona, email });
  },
  identify: (email: string, properties: Record<string, any>) => {
    // TODO: posthog.identify(email, properties);
    console.log('[Analytics] identify', { email, properties });
  },
};

// Meta Pixel (Facebook) integration
const trackPixelEvent = (eventName: string, eventData?: Record<string, any>) => {
  if (typeof window !== 'undefined' && 'fbq' in window) {
    const fbq = (window as any).fbq;
    fbq('track', eventName, eventData);
  }
};

// API configuration
const getApiConfig = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
  const backendApiKey = process.env.REACT_APP_BACKEND_API_KEY || '';
  const funnelApiKey = process.env.REACT_APP_FUNNEL_API_KEY || '';

  return { backendUrl, backendApiKey, funnelApiKey };
};

/**
 * Helper to make authenticated API calls to backend
 */
const callBackendAPI = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const { backendUrl, backendApiKey } = getApiConfig();

  return fetch(`${backendUrl}${endpoint}`, {
    ...options,
    headers: {
      'X-API-Key': backendApiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

/**
 * Helper to make authenticated API calls to funnel API
 */
const callFunnelAPI = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const { backendUrl, funnelApiKey } = getApiConfig();

  return fetch(`${backendUrl}${endpoint}`, {
    ...options,
    headers: {
      'X-Funnel-API-Key': funnelApiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

/**
 * Hook for managing funnel analytics and API interactions
 * @returns Tracking and API functions
 */
export function useFunnelTracking(): UseFunnelTrackingReturn {
  // Tracking functions
  const trackStepView = useCallback((stepId: string, stepNumber?: number) => {
    trackAnalytics.stepViewed(stepId, stepNumber);
  }, []);

  const trackResponse = useCallback((stepId: string, response: any) => {
    trackAnalytics.questionAnswered('A', stepId, response);
  }, []);

  const trackCompletion = useCallback((responses: Record<string, any>) => {
    // Track all responses
    Object.entries(responses).forEach(([stepId, response]) => {
      trackResponse(stepId, response);
    });
  }, [trackResponse]);

  const trackPersonaSelection = useCallback((persona: Persona) => {
    trackAnalytics.personaSelected(persona);
  }, []);

  const trackEmailSubmitted = useCallback((email: string, path: 'free' | 'paid') => {
    trackAnalytics.emailSubmitted('A', path);
  }, []);

  const trackCheckoutStarted = useCallback((persona: Persona, priceId: string) => {
    trackAnalytics.checkoutStarted(persona, priceId);
    trackPixelEvent('Checkout', { content_name: persona, value: 11.99, currency: 'GBP' });
  }, []);

  const trackCheckoutCompleted = useCallback((persona: Persona) => {
    trackAnalytics.checkoutCompleted(persona);
    trackPixelEvent('Subscribe', { content_name: persona, value: 11.99, currency: 'GBP' });
  }, []);

  const trackAccountCreated = useCallback((persona: Persona, email: string) => {
    trackAnalytics.accountCreated(persona, email);
    trackPixelEvent('Lead', { content_name: persona });
  }, []);

  const identifyUser = useCallback((email: string, properties: Record<string, any>) => {
    trackAnalytics.identify(email, properties);
    if (typeof window !== 'undefined' && 'fbq' in window) {
      const fbq = (window as any).fbq;
      fbq('init', process.env.REACT_APP_FACEBOOK_PIXEL_ID);
    }
  }, []);

  // API Functions
  const submitFunnelData = useCallback(async (data: FunnelResponse): Promise<void> => {
    try {
      const response = await callFunnelAPI('/api/funnel-responses', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit funnel data: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Funnel data submitted:', result);
    } catch (error) {
      console.error('Error submitting funnel data:', error);
      throw error;
    }
  }, []);

  const submitEmail = useCallback(async (email: string, persona: Persona): Promise<void> => {
    try {
      const response = await callBackendAPI('/api/emails', {
        method: 'POST',
        body: JSON.stringify({ email, persona, source: 'funnel' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit email: ${response.statusText}`);
      }

      trackEmailSubmitted(email, 'free');
    } catch (error) {
      console.error('Error submitting email:', error);
      throw error;
    }
  }, [trackEmailSubmitted]);

  const checkUserExists = useCallback(async (email: string): Promise<boolean> => {
    try {
      const response = await callBackendAPI('/api/check-user-subscription', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.exists || data.subscribed;
    } catch (error) {
      console.error('Error checking user:', error);
      return false;
    }
  }, []);

  const createCheckoutSession = useCallback(
    async (email: string, priceId: string, persona: Persona): Promise<string> => {
      try {
        trackCheckoutStarted(persona, priceId);

        const response = await callFunnelAPI('/api/stripe/checkout', {
          method: 'GET',
          headers: {
            'X-Email': email,
            'X-Price-Id': priceId,
            'X-Persona': persona,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create checkout session');
        }

        const data = await response.json();
        return data.url;
      } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
      }
    },
    [trackCheckoutStarted]
  );

  return {
    trackStepView,
    trackResponse,
    trackCompletion,
    trackPersonaSelection,
    trackEmailSubmitted,
    trackCheckoutStarted,
    trackCheckoutCompleted,
    trackAccountCreated,
    submitFunnelData,
    submitEmail,
    checkUserExists,
    createCheckoutSession,
    identifyUser,
  };
}
