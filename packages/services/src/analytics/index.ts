/**
 * @anplexa/services - Analytics Module
 * Unified PostHog wrapper for type-safe event tracking
 */

export type { AnalyticsClientConfig } from './client';
export {
  AnalyticsClient,
  getAnalyticsClient,
  initializeAnalytics,
  identify,
  track,
  reset,
  pageView,
  flush,
} from './client';

export { AnalyticsEvents } from './events';
export type { EventName, EventProperties, UserProperties } from './events';
export { isValidEventProperties } from './events';
