/**
 * @anplexa/services - External Service Integrations
 * Unified wrappers for external services used across Anplexa applications
 *
 * Phase 1 Services:
 * - Analytics: PostHog wrapper with type-safe event tracking
 * - Stripe: Unified payment processing (planned)
 * - Email: Unified email service (planned)
 * - Auth: Authentication service (planned)
 * - AI: AI provider abstraction (planned)
 */

// Analytics Service - Type-safe event tracking
export * from './analytics/index.js';

// Stripe payment service
export * from './stripe/index.js';

// Email service
export * from './email/index.js';

// Auth Services
export * from './auth/index.js';

// AI Services
export * from './ai/index.js';

// ComfyUI Services
export * from './comfyui/index.js';

// Letta Services
export * from './letta/index.js';

// Astrology Services
export { SimplifiedAstrologyService } from './astrology/SimplifiedAstrologyService.js';
