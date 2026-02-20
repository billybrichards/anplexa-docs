/**
 * @anplexa/services - Analytics Module
 * Unified PostHog wrapper for type-safe event tracking
 */
export type { AnalyticsClientConfig } from './client.js';
export { AnalyticsClient, getAnalyticsClient, initializeAnalytics, identify, track, reset, pageView, flush, } from './client.js';
export { AnalyticsEvents } from './events.js';
export type { EventName, EventProperties, UserProperties } from './events.js';
export { isValidEventProperties } from './events.js';
//# sourceMappingURL=index.d.ts.map