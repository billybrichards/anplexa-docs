/**
 * @anplexa/config
 * Centralized configuration, environment variables, and constants for the Anplexa monorepo
 */

// Environment variables with Zod validation
export { env, getStripeKeys, getDatabaseType, getBaseUrl } from './env.js';
export type { Env } from './env.js';

// Application constants
export {
  STRIPE_PRICES,
  CREDITS,
  PERSONALITY_MODES,
  DEFAULT_PERSONALITY_MODE,
  API_ENDPOINTS,
  RATE_LIMITS,
  FEATURE_FLAGS,
  SESSION,
  REDIRECTS,
  ERROR_CODES,
  HTTP_STATUS,
  LOG_LEVELS,
  DEFAULT_MODELS,
  SUBSCRIPTION_PLANS,
  VALIDATION_PATTERNS,
  TIMEOUTS,
  MESSAGES,
} from './constants.js';
export type { PersonalityMode, SubscriptionPlan } from './constants.js';
