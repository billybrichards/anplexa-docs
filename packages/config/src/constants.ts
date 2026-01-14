/**
 * Stripe Product & Price IDs
 * These are hardcoded Stripe product IDs from the Anplexa Stripe account
 */
export const STRIPE_PRICES = {
  // Subscription pricing
  yearly: 'price_1SkBhsHf3F7YsE79UDhlyjdG', // £11.99/year (early adopter £0.99/mo)
  monthly: 'price_1Sj3Q4Hf3F7YsE79EfGL6BuF', // £2.99/month (standard)
} as const;

/**
 * Credit System Configuration
 */
export const CREDITS = {
  // Daily free credits for non-paying users
  dailyFreeCredits: 5,
  // Credit cap (max credits accumulated)
  maxDailyCredits: 5,
} as const;

/**
 * Personality Modes
 * Different conversation personality profiles
 */
export const PERSONALITY_MODES = {
  default: 'default',
  professional: 'professional',
  casual: 'casual',
  technical: 'technical',
} as const;

export type PersonalityMode = (typeof PERSONALITY_MODES)[keyof typeof PERSONALITY_MODES];

/**
 * Default Personality Mode
 */
export const DEFAULT_PERSONALITY_MODE: PersonalityMode = PERSONALITY_MODES.default;

/**
 * API Endpoints & Routes
 */
export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    register: '/api/auth/register',
    refresh: '/api/auth/refresh',
  },
  // Chat
  chat: {
    stream: '/api/chat/stream',
    complete: '/api/chat/complete',
  },
  // Stripe
  stripe: {
    checkout: '/api/stripe/checkout',
    webhook: '/api/stripe/webhook',
    pricing: '/api/stripe/pricing',
  },
  // Admin
  admin: {
    dashboard: '/api/admin/dashboard',
    settings: '/api/admin/settings',
  },
  // Health
  health: '/api/health',
} as const;

/**
 * Rate Limits
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
  },
  // General API
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
  },
  // Streaming endpoints (more lenient)
  stream: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
  },
} as const;

/**
 * Feature Flags
 */
export const FEATURE_FLAGS = {
  // Payment features
  stripeEnabled: true,
  // AI features
  ollamaEnabled: true,
  // Admin panel
  adminPanelEnabled: true,
  // Webhook integrations
  webhooksEnabled: true,
  // Funnel/marketing features
  funnelEnabled: true,
} as const;

/**
 * Session Configuration
 */
export const SESSION = {
  // JWT token expiry times
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  // Session cookie settings
  cookieName: 'anplexa_session',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  cookieSameSite: 'lax' as const,
} as const;

/**
 * Redirect URLs
 */
export const REDIRECTS = {
  defaultAfterLogin: 'https://anplexa.com/dash',
  defaultAfterLogout: 'https://anplexa.com/',
  stripeReturn: 'https://anplexa.com/pricing/success',
  stripeCancel: 'https://anplexa.com/pricing/cancel',
} as const;

/**
 * Error Codes
 */
export const ERROR_CODES = {
  // Credit system
  CREDIT_LIMIT_REACHED: 'CREDIT_LIMIT_REACHED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  // Stripe
  STRIPE_ERROR: 'STRIPE_ERROR',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  // AI/Ollama
  AI_ERROR: 'AI_ERROR',
  MODEL_NOT_AVAILABLE: 'MODEL_NOT_AVAILABLE',
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Logging Levels
 */
export const LOG_LEVELS = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
} as const;

/**
 * Default Models for Ollama
 */
export const DEFAULT_MODELS = {
  general: 'darkplanet-general:latest',
  longform: 'dolphin-mixtral:latest',
} as const;

/**
 * Subscription Plans
 */
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    credits: 5,
    renewal: 'daily',
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    priceId: STRIPE_PRICES.monthly,
    credits: -1, // Unlimited
    price: 299, // In pence
    currency: 'GBP',
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly',
    priceId: STRIPE_PRICES.yearly,
    credits: -1, // Unlimited
    price: 1199, // In pence
    currency: 'GBP',
  },
} as const;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];

/**
 * Validation Patterns
 */
export const VALIDATION_PATTERNS = {
  // Email regex
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // UUID v4
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  // JWT format
  jwt: /^[\w\-]+\.[\w\-]+\.[\w\-]+$/,
  // Stripe key format
  stripeKey: /^(sk_test_|sk_live_)[a-zA-Z0-9_]+$/,
  // URL
  url: /^https?:\/\/.+/,
} as const;

/**
 * Timeout Configuration (in milliseconds)
 */
export const TIMEOUTS = {
  // API request timeouts
  apiRequest: 30 * 1000, // 30 seconds
  // Stripe webhook timeout
  stripe: 10 * 1000, // 10 seconds
  // Database query timeout
  database: 30 * 1000, // 30 seconds
  // AI model timeout
  ai: 120 * 1000, // 2 minutes
} as const;

/**
 * Message/Prompt Templates
 */
export const MESSAGES = {
  // Default system prompt for Anplexa
  defaultSystemPrompt: 'You are Anplexa, a helpful AI assistant.',
  // Error messages
  errors: {
    creditLimitReached: 'You have reached your daily credit limit. Upgrade your plan for unlimited access.',
    invalidCredentials: 'Invalid email or password.',
    tokenExpired: 'Your session has expired. Please log in again.',
    internalError: 'An internal error occurred. Please try again later.',
    aiUnavailable: 'The AI service is currently unavailable. Please try again later.',
  },
} as const;
