import { z } from 'zod';

/**
 * Server Environment Variables
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
});

/**
 * Database Environment Variables
 */
const databaseSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
});

/**
 * Ollama AI Configuration
 */
const ollamaSchema = z.object({
  OLLAMA_BASE_URL: z.string().min(1, 'OLLAMA_BASE_URL is required'),
  OLLAMA_API_KEY: z.string().min(1, 'OLLAMA_API_KEY is required'),
  OLLAMA_GENERAL_MODEL: z.string().default('darkplanet-general:latest'),
  OLLAMA_LONGFORM_MODEL: z.string().default('dolphin-mixtral:latest'),
});

/**
 * JWT Authentication
 */
const authSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  ADMIN_UI_PASSWORD: z.string().optional(),
});

/**
 * Stripe Payment Configuration
 * Supports both environment-specific keys (LIVE/TEST) and generic keys
 */
const stripeSchema = z.object({
  // Generic keys (fallback)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Live keys (production)
  STRIPE_LIVE_SECRET_KEY: z.string().optional(),
  STRIPE_LIVE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_LIVE_WEBHOOK_SECRET: z.string().optional(),
  // Test keys (development)
  STRIPE_TEST_SECRET_KEY: z.string().optional(),
  STRIPE_TEST_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_TEST_WEBHOOK_SECRET: z.string().optional(),
  // Pricing
  STRIPE_PRICE_MONTHLY: z.string().optional(),
  STRIPE_PRICE_YEARLY: z.string().optional(),
});

/**
 * Email Configuration
 */
const emailSchema = z.object({
  REPLIT_CONNECTORS_HOSTNAME: z.string().optional(),
  REPL_IDENTITY: z.string().optional(),
  WEB_REPL_RENEWAL: z.string().optional(),
});

/**
 * Deployment & Domain Configuration
 */
const deploymentSchema = z.object({
  REPLIT_DOMAINS: z.string().optional(),
  REPLIT_DEPLOYMENT: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
});

/**
 * API & Security
 */
const apiSchema = z.object({
  WEBHOOK_SECRET: z.string().optional(),
  FUNNEL_API_SECRET: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  INTERNAL_API_KEY: z.string().optional(),
  API_BASE_URL: z.string().url().optional(),
});

/**
 * LiveKit Voice/Video Configuration
 */
const livekitSchema = z.object({
  LIVEKIT_URL: z.string().optional(),
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
});

/**
 * Redis Configuration
 */
const redisSchema = z.object({
  REDIS_URL: z.string().optional(),
});

/**
 * Voice/Video Provider API Keys
 */
const voiceProviderSchema = z.object({
  ELEVENLABS_API_KEY: z.string().optional(),
  DEEPGRAM_API_KEY: z.string().optional(),
  SIMLI_API_KEY: z.string().optional(),
});

/**
 * Complete environment schema - combines all subcategories
 */
const envSchema = z.object({
  ...serverSchema.shape,
  ...databaseSchema.shape,
  ...ollamaSchema.shape,
  ...authSchema.shape,
  ...stripeSchema.shape,
  ...emailSchema.shape,
  ...deploymentSchema.shape,
  ...apiSchema.shape,
  ...livekitSchema.shape,
  ...redisSchema.shape,
  ...voiceProviderSchema.shape,
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 */
function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    parsed.error.errors.forEach((error) => {
      const path = error.path.join('.');
      console.error(`   ${path}: ${error.message}`);
    });
    throw new Error('Environment validation failed');
  }

  return parsed.data;
}

// Parse and export the validated environment
export const env = parseEnv();

/**
 * Helper function to get Stripe keys based on environment
 */
export function getStripeKeys(nodeEnv: string = env.NODE_ENV) {
  const isProduction = nodeEnv === 'production';

  return {
    secretKey: isProduction
      ? env.STRIPE_LIVE_SECRET_KEY || env.STRIPE_SECRET_KEY
      : env.STRIPE_TEST_SECRET_KEY || env.STRIPE_SECRET_KEY,
    publishableKey: isProduction
      ? env.STRIPE_LIVE_PUBLISHABLE_KEY || env.STRIPE_PUBLISHABLE_KEY
      : env.STRIPE_TEST_PUBLISHABLE_KEY || env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: isProduction
      ? env.STRIPE_LIVE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET
      : env.STRIPE_TEST_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET,
  };
}

/**
 * Helper function to get database type from DATABASE_URL
 */
export function getDatabaseType(): 'postgres' | 'sqlite' {
  return env.DATABASE_URL.startsWith('postgres') ? 'postgres' : 'sqlite';
}

/**
 * Helper function to get base URL from deployment configuration
 */
export function getBaseUrl(): string {
  if (env.REPLIT_DOMAINS) {
    return `https://${env.REPLIT_DOMAINS.split(',')[0]}`;
  }
  if (env.FRONTEND_URL) {
    return env.FRONTEND_URL;
  }
  return 'http://localhost:3000';
}
