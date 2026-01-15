/**
 * IVerificationProviderService Port
 *
 * Interface for age verification providers (Yoti, Veriff, etc.).
 */

export interface VerificationSession {
  sessionId: string;
  verificationUrl: string;
  expiresAt: Date;
}

export interface VerificationResult {
  sessionId: string;
  verified: boolean;
  ageConfirmed?: boolean;
  metadata?: Record<string, any>;
}

export interface IVerificationProviderService {
  /**
   * Initiate age verification session
   */
  initiateVerification(userId: string): Promise<VerificationSession>;

  /**
   * Check verification status
   */
  checkStatus(sessionId: string): Promise<VerificationResult>;
}
