/**
 * MockVerificationService
 *
 * Mock implementation of IVerificationProviderService for development.
 * In production, integrate with Yoti, Veriff, or similar provider.
 */

import { IVerificationProviderService, type VerificationSession, type VerificationResult } from '@anplexa/cosmic-companion/use-cases/ports';
import { randomUUID } from 'crypto';

export class MockVerificationService implements IVerificationProviderService {
  private sessions: Map<string, { userId: string; verified: boolean }> = new Map();

  async initiateVerification(userId: string): Promise<VerificationSession> {
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store mock session
    this.sessions.set(sessionId, { userId, verified: false });

    return {
      sessionId,
      verificationUrl: `https://mock-verification.com/verify/${sessionId}`,
      expiresAt
    };
  }

  async checkStatus(sessionId: string): Promise<VerificationResult> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        sessionId,
        verified: false,
        ageConfirmed: false
      };
    }

    // Mock: Auto-verify after 5 seconds (for development)
    // In production, this would query the actual provider
    const verified = true; // Always pass for mock
    const ageConfirmed = true;

    if (verified) {
      session.verified = true;
    }

    return {
      sessionId,
      verified,
      ageConfirmed,
      metadata: {
        provider: 'mock',
        verifiedAt: new Date().toISOString()
      }
    };
  }
}

/**
 * YotiVerificationService - Production implementation outline
 *
 * export class YotiVerificationService implements IVerificationProviderService {
 *   constructor(
 *     private readonly sdkId: string,
 *     private readonly pemKey: string
 *   ) {}
 *
 *   async initiateVerification(userId: string): Promise<VerificationSession> {
 *     // Create Yoti session
 *     const response = await fetch('https://api.yoti.com/sessions', {
 *       method: 'POST',
 *       headers: { 'X-Yoti-SDK-ID': this.sdkId },
 *       body: JSON.stringify({
 *         requested_checks: [{ type: 'ID_DOCUMENT_AUTHENTICITY' }],
 *         notification_settings: { webhook_url: `${baseUrl}/api/cosmic/verification/webhook` }
 *       })
 *     });
 *
 *     const data = await response.json();
 *     return {
 *       sessionId: data.session_id,
 *       verificationUrl: data.client_session_token_ttl,
 *       expiresAt: new Date(data.expires_at)
 *     };
 *   }
 *
 *   async checkStatus(sessionId: string): Promise<VerificationResult> {
 *     // Query Yoti API for session status
 *   }
 * }
 */
