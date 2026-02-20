/**
 * Unified Analytics Client Wrapper
 * Abstracts PostHog implementation to support both browser and Node.js environments
 * Provides type-safe event tracking across all Anplexa applications
 */

import type { EventName, EventProperties, UserProperties } from './events.js';
import { isValidEventProperties } from './events.js';

/**
 * Configuration options for analytics client initialization
 */
export interface AnalyticsClientConfig {
  posthogKey?: string;
  posthogHost?: string;
  environment?: 'development' | 'production' | 'staging';
  isServer?: boolean;
}

/**
 * Internal PostHog client interface
 * Abstracts away differences between posthog-js (browser) and posthog-node (server)
 */
interface PostHogClient {
  identify?(userId: string, properties?: Record<string, any>): void;
  reset?(): void;
  capture?(eventName: string, properties?: Record<string, any>): void;
  people?: {
    set?(properties: Record<string, any>): void;
  };
  flush?(): Promise<void>;
}

/**
 * Analytics Client - Unified wrapper for PostHog
 *
 * Usage in browser:
 * ```typescript
 * import { analyticsClient } from '@anplexa/services/analytics';
 * analyticsClient.identify('user-123', { email: 'user@example.com' });
 * analyticsClient.track('message_sent', { message_length: 142, is_guest: false, message_count: 5 });
 * ```
 *
 * Usage in server:
 * ```typescript
 * import { analyticsClient } from '@anplexa/services/analytics';
 * await analyticsClient.track('user_signed_up', { email: 'user@example.com', method: 'email' });
 * ```
 */
export class AnalyticsClient {
  private client: PostHogClient | null = null;
  private initialized = false;
  private config: AnalyticsClientConfig;

  constructor(config: AnalyticsClientConfig = {}) {
    this.config = config;
  }

  /**
   * Initialize the analytics client
   * Should be called once at application startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const { posthogKey, posthogHost = 'https://us.i.posthog.com', isServer: forceServer } = this.config;
    const isServer = forceServer ?? (typeof window === 'undefined');

    if (!posthogKey) {
      console.warn('[Analytics] PostHog key not configured, analytics disabled');
      return;
    }

    try {
      if (isServer) {
        // Server-side initialization (Node.js)
        const PostHog = await this.importPostHogNode();
        if (PostHog) {
          this.client = new PostHog(posthogKey, { host: posthogHost });
        }
      } else {
        // Client-side initialization (Browser)
        const posthog = await this.importPostHogBrowser();
        if (posthog) {
          posthog.init(posthogKey, {
            api_host: posthogHost,
            person_profiles: 'identified_only',
            capture_pageview: false,
            capture_pageleave: true,
            persistence: 'localStorage+cookie',
            autocapture: {
              dom_event_allowlist: ['click', 'submit'],
              element_allowlist: ['button', 'a', 'input'],
            },
          });
          this.client = posthog;
        }
      }

      this.initialized = true;
      console.log('[Analytics] Initialized successfully');
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
      this.client = null;
    }
  }

  /**
   * Identify a user
   * Links all subsequent events to this user
   */
  identify(userId: string, properties?: UserProperties): void {
    if (!this.shouldTrack()) {
      return;
    }

    try {
      if (this.client?.identify) {
        this.client.identify(userId, properties);
      }
    } catch (error) {
      console.error('[Analytics] Identify failed:', error);
    }
  }

  /**
   * Set properties on the current user
   * Updates user profile without creating an event
   */
  setUserProperties(properties: UserProperties): void {
    if (!this.shouldTrack()) {
      return;
    }

    try {
      if (this.client?.people?.set) {
        this.client.people.set(properties);
      }
    } catch (error) {
      console.error('[Analytics] Set user properties failed:', error);
    }
  }

  /**
   * Track an event with type-safe properties
   *
   * @template E - The event name type (ensures properties match event)
   * @param eventName - Name of the event to track
   * @param properties - Event properties (validated at type level)
   *
   * @example
   * ```typescript
   * // Type-safe - properties must match event
   * analyticsClient.track('message_sent', {
   *   message_length: 150,
   *   is_guest: false,
   *   message_count: 5
   * });
   *
   * // TypeScript error - missing required property
   * analyticsClient.track('message_sent', {
   *   message_length: 150
   * });
   * ```
   */
  track<E extends EventName>(eventName: E, properties?: EventProperties[E]): void {
    if (!this.shouldTrack()) {
      return;
    }

    if (properties && !isValidEventProperties(eventName, properties)) {
      console.error('[Analytics] Invalid properties for event:', eventName, properties);
      return;
    }

    try {
      if (this.client?.capture) {
        const allProps = this.enrichProperties(properties);
        this.client.capture(eventName, allProps);
      }
    } catch (error) {
      console.error('[Analytics] Capture failed:', error);
    }
  }

  /**
   * Reset user identity (for logout)
   * Clears all user-specific data and generates new anonymous ID
   */
  reset(): void {
    if (!this.shouldTrack()) {
      return;
    }

    try {
      if (this.client?.reset) {
        this.client.reset();
      }
    } catch (error) {
      console.error('[Analytics] Reset failed:', error);
    }
  }

  /**
   * Track a page view
   * Automatically captures current URL
   */
  pageView(path?: string, title?: string): void {
    if (!this.shouldTrack()) {
      return;
    }

    try {
      let currentUrl = 'unknown';
      if (typeof window !== 'undefined' && window.location) {
        currentUrl = window.location.href;
      }

      this.track('$pageview', {
        $current_url: currentUrl,
        path,
        title,
      } as EventProperties['$pageview']);
    } catch (error) {
      console.error('[Analytics] Page view failed:', error);
    }
  }

  /**
   * Flush pending events (for server-side use)
   * Ensures all queued events are sent before shutdown
   */
  async flush(): Promise<void> {
    if (!this.client?.flush) {
      return;
    }

    try {
      await this.client.flush();
    } catch (error) {
      console.error('[Analytics] Flush failed:', error);
    }
  }

  /**
   * Check if analytics should be active
   * Returns false if PostHog not configured or in invalid environment
   */
  private shouldTrack(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Dynamically import PostHog for browser
   * Avoids bundling errors in server environments
   */
  private async importPostHogBrowser(): Promise<any> {
    try {
      if (typeof window !== 'undefined') {
        const module = await import('posthog-js');
        return module.default;
      }
      return null;
    } catch {
      console.warn('[Analytics] posthog-js not available in this environment');
      return null;
    }
  }

  /**
   * Dynamically import PostHog for server
   * Only works in Node.js environment
   */
  private async importPostHogNode(): Promise<any> {
    try {
      const module = await import('posthog-node');
      return module.PostHog;
    } catch {
      console.warn('[Analytics] posthog-node not available, server analytics disabled');
      return null;
    }
  }

  /**
   * Enrich event properties with common metadata
   */
  private enrichProperties(properties?: Record<string, any>): Record<string, any> {
    const enriched = { ...properties };

    // Add timestamp if not present
    if (!enriched.timestamp) {
      enriched.timestamp = new Date().toISOString();
    }

    return enriched;
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Global singleton instance
 * Use for convenient access throughout the application
 */
let globalClient: AnalyticsClient | null = null;

/**
 * Get or create the global analytics client
 */
export function getAnalyticsClient(config?: AnalyticsClientConfig): AnalyticsClient {
  if (!globalClient) {
    globalClient = new AnalyticsClient(config);
  }
  return globalClient;
}

/**
 * Initialize global analytics client
 * Should be called once at application startup
 */
export async function initializeAnalytics(config?: AnalyticsClientConfig): Promise<void> {
  const client = getAnalyticsClient(config);
  await client.initialize();
}

/**
 * Shorthand functions for quick access
 */

export function identify(userId: string, properties?: UserProperties): void {
  getAnalyticsClient().identify(userId, properties);
}

export function track<E extends EventName>(eventName: E, properties?: EventProperties[E]): void {
  getAnalyticsClient().track(eventName, properties);
}

export function reset(): void {
  getAnalyticsClient().reset();
}

export function pageView(path?: string, title?: string): void {
  getAnalyticsClient().pageView(path, title);
}

export async function flush(): Promise<void> {
  await getAnalyticsClient().flush();
}
