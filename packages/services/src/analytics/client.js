"use strict";
/**
 * Unified Analytics Client Wrapper
 * Abstracts PostHog implementation to support both browser and Node.js environments
 * Provides type-safe event tracking across all Anplexa applications
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsClient = void 0;
exports.getAnalyticsClient = getAnalyticsClient;
exports.initializeAnalytics = initializeAnalytics;
exports.identify = identify;
exports.track = track;
exports.reset = reset;
exports.pageView = pageView;
exports.flush = flush;
const events_1 = require("./events");
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
class AnalyticsClient {
    client = null;
    initialized = false;
    config;
    constructor(config = {}) {
        this.config = config;
    }
    /**
     * Initialize the analytics client
     * Should be called once at application startup
     */
    async initialize() {
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
            }
            else {
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
        }
        catch (error) {
            console.error('[Analytics] Initialization failed:', error);
            this.client = null;
        }
    }
    /**
     * Identify a user
     * Links all subsequent events to this user
     */
    identify(userId, properties) {
        if (!this.shouldTrack()) {
            return;
        }
        try {
            if (this.client?.identify) {
                this.client.identify(userId, properties);
            }
        }
        catch (error) {
            console.error('[Analytics] Identify failed:', error);
        }
    }
    /**
     * Set properties on the current user
     * Updates user profile without creating an event
     */
    setUserProperties(properties) {
        if (!this.shouldTrack()) {
            return;
        }
        try {
            if (this.client?.people?.set) {
                this.client.people.set(properties);
            }
        }
        catch (error) {
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
    track(eventName, properties) {
        if (!this.shouldTrack()) {
            return;
        }
        if (properties && !(0, events_1.isValidEventProperties)(eventName, properties)) {
            console.error('[Analytics] Invalid properties for event:', eventName, properties);
            return;
        }
        try {
            if (this.client?.capture) {
                const allProps = this.enrichProperties(properties);
                this.client.capture(eventName, allProps);
            }
        }
        catch (error) {
            console.error('[Analytics] Capture failed:', error);
        }
    }
    /**
     * Reset user identity (for logout)
     * Clears all user-specific data and generates new anonymous ID
     */
    reset() {
        if (!this.shouldTrack()) {
            return;
        }
        try {
            if (this.client?.reset) {
                this.client.reset();
            }
        }
        catch (error) {
            console.error('[Analytics] Reset failed:', error);
        }
    }
    /**
     * Track a page view
     * Automatically captures current URL
     */
    pageView(path, title) {
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
            });
        }
        catch (error) {
            console.error('[Analytics] Page view failed:', error);
        }
    }
    /**
     * Flush pending events (for server-side use)
     * Ensures all queued events are sent before shutdown
     */
    async flush() {
        if (!this.client?.flush) {
            return;
        }
        try {
            await this.client.flush();
        }
        catch (error) {
            console.error('[Analytics] Flush failed:', error);
        }
    }
    /**
     * Check if analytics should be active
     * Returns false if PostHog not configured or in invalid environment
     */
    shouldTrack() {
        return this.initialized && this.client !== null;
    }
    /**
     * Dynamically import PostHog for browser
     * Avoids bundling errors in server environments
     */
    async importPostHogBrowser() {
        try {
            if (typeof window !== 'undefined') {
                const module = await Promise.resolve().then(() => __importStar(require('posthog-js')));
                return module.default;
            }
            return null;
        }
        catch {
            console.warn('[Analytics] posthog-js not available in this environment');
            return null;
        }
    }
    /**
     * Dynamically import PostHog for server
     * Only works in Node.js environment
     */
    async importPostHogNode() {
        try {
            const module = await Promise.resolve().then(() => __importStar(require('posthog-node')));
            return module.PostHog;
        }
        catch {
            console.warn('[Analytics] posthog-node not available, server analytics disabled');
            return null;
        }
    }
    /**
     * Enrich event properties with common metadata
     */
    enrichProperties(properties) {
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
    isInitialized() {
        return this.initialized;
    }
}
exports.AnalyticsClient = AnalyticsClient;
/**
 * Global singleton instance
 * Use for convenient access throughout the application
 */
let globalClient = null;
/**
 * Get or create the global analytics client
 */
function getAnalyticsClient(config) {
    if (!globalClient) {
        globalClient = new AnalyticsClient(config);
    }
    return globalClient;
}
/**
 * Initialize global analytics client
 * Should be called once at application startup
 */
async function initializeAnalytics(config) {
    const client = getAnalyticsClient(config);
    await client.initialize();
}
/**
 * Shorthand functions for quick access
 */
function identify(userId, properties) {
    getAnalyticsClient().identify(userId, properties);
}
function track(eventName, properties) {
    getAnalyticsClient().track(eventName, properties);
}
function reset() {
    getAnalyticsClient().reset();
}
function pageView(path, title) {
    getAnalyticsClient().pageView(path, title);
}
async function flush() {
    await getAnalyticsClient().flush();
}
