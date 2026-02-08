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
export * from './analytics.js';
export * from './stripe/index.js';
export * from './email/index.js';
export * from './auth.js';
export * from './ai.js';
export { SimplifiedAstrologyService } from './astrology/SimplifiedAstrologyService.js';
//# sourceMappingURL=index.d.ts.map