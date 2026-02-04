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
export * from './analytics';
export * from './stripe/index';
export * from './email/index';
export * from './auth';
export * from './ai';
export { SimplifiedAstrologyService } from './astrology/SimplifiedAstrologyService';
//# sourceMappingURL=index.d.ts.map