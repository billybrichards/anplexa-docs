/**
 * Unified Analytics Client Wrapper
 * Abstracts PostHog implementation to support both browser and Node.js environments
 * Provides type-safe event tracking across all Anplexa applications
 */
import type { EventName, EventProperties, UserProperties } from './events';
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
export declare class AnalyticsClient {
    private client;
    private initialized;
    private config;
    constructor(config?: AnalyticsClientConfig);
    /**
     * Initialize the analytics client
     * Should be called once at application startup
     */
    initialize(): Promise<void>;
    /**
     * Identify a user
     * Links all subsequent events to this user
     */
    identify(userId: string, properties?: UserProperties): void;
    /**
     * Set properties on the current user
     * Updates user profile without creating an event
     */
    setUserProperties(properties: UserProperties): void;
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
    track<E extends EventName>(eventName: E, properties?: EventProperties[E]): void;
    /**
     * Reset user identity (for logout)
     * Clears all user-specific data and generates new anonymous ID
     */
    reset(): void;
    /**
     * Track a page view
     * Automatically captures current URL
     */
    pageView(path?: string, title?: string): void;
    /**
     * Flush pending events (for server-side use)
     * Ensures all queued events are sent before shutdown
     */
    flush(): Promise<void>;
    /**
     * Check if analytics should be active
     * Returns false if PostHog not configured or in invalid environment
     */
    private shouldTrack;
    /**
     * Dynamically import PostHog for browser
     * Avoids bundling errors in server environments
     */
    private importPostHogBrowser;
    /**
     * Dynamically import PostHog for server
     * Only works in Node.js environment
     */
    private importPostHogNode;
    /**
     * Enrich event properties with common metadata
     */
    private enrichProperties;
    /**
     * Check if client is initialized
     */
    isInitialized(): boolean;
}
/**
 * Get or create the global analytics client
 */
export declare function getAnalyticsClient(config?: AnalyticsClientConfig): AnalyticsClient;
/**
 * Initialize global analytics client
 * Should be called once at application startup
 */
export declare function initializeAnalytics(config?: AnalyticsClientConfig): Promise<void>;
/**
 * Shorthand functions for quick access
 */
export declare function identify(userId: string, properties?: UserProperties): void;
export declare function track<E extends EventName>(eventName: E, properties?: EventProperties[E]): void;
export declare function reset(): void;
export declare function pageView(path?: string, title?: string): void;
export declare function flush(): Promise<void>;
//# sourceMappingURL=client.d.ts.map