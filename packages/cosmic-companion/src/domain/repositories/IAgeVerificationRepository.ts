/**
 * IAgeVerificationRepository
 *
 * Repository interface for AgeVerification aggregate.
 */

import { AgeVerification } from '../entities/AgeVerification.js';

export interface IAgeVerificationRepository {
  save(verification: AgeVerification): Promise<void>;
  findById(id: string): Promise<AgeVerification | null>;
  findByUserId(userId: string): Promise<AgeVerification | null>;
  findByProviderSessionId(sessionId: string): Promise<AgeVerification | null>;
  delete(id: string): Promise<void>;
}
