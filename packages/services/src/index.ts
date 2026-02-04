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
export * from './analytics';

// Stripe payment service
export * from './stripe/index';

// Email service
export * from './email/index';

// Auth Services
export * from './auth';

// AI Services
export * from './ai';

// Astrology Services
export { SimplifiedAstrologyService } from './astrology/SimplifiedAstrologyService';
