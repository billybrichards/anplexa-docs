"use strict";
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Analytics Service - Type-safe event tracking
__exportStar(require("./analytics"), exports);
// Stripe payment service
__exportStar(require("./stripe/index.js"), exports);
// Email service
__exportStar(require("./email/index.js"), exports);
// Auth Services
__exportStar(require("./auth"), exports);
// AI Services
__exportStar(require("./ai"), exports);
