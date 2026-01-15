/**
 * AgeVerification Entity
 *
 * Represents age verification status for NSFW content access.
 * Required by California SB 243 and other regulations.
 */

export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'expired';
export type VerificationMethod = 'government-id' | 'credit-card' | 'third-party' | 'manual-review';

export interface AgeVerificationProps {
  id: string;
  userId: string;
  status: VerificationStatus;
  method: VerificationMethod;
  verifiedAt?: Date;
  expiresAt?: Date;
  providerSessionId?: string; // External provider (Yoti, Veriff, etc.)
  metadata?: Record<string, any>; // Provider-specific data
  createdAt: Date;
  updatedAt: Date;
}

export class AgeVerification {
  private constructor(private props: AgeVerificationProps) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get status(): VerificationStatus {
    return this.props.status;
  }

  get method(): VerificationMethod {
    return this.props.method;
  }

  get verifiedAt(): Date | undefined {
    return this.props.verifiedAt;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get providerSessionId(): string | undefined {
    return this.props.providerSessionId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if verification is currently valid
   */
  isValid(): boolean {
    if (this.props.status !== 'verified') {
      return false;
    }

    // Check if expired
    if (this.props.expiresAt && new Date() > this.props.expiresAt) {
      return false;
    }

    return true;
  }

  /**
   * Mark verification as complete
   */
  markVerified(): void {
    this.props.status = 'verified';
    this.props.verifiedAt = new Date();
    // Verification valid for 1 year
    this.props.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    this.props.updatedAt = new Date();
  }

  /**
   * Mark verification as failed
   */
  markFailed(): void {
    this.props.status = 'failed';
    this.props.updatedAt = new Date();
  }

  /**
   * Check if verification has expired
   */
  hasExpired(): boolean {
    if (!this.props.expiresAt) {
      return false;
    }
    return new Date() > this.props.expiresAt;
  }

  /**
   * Create a new AgeVerification (pending status)
   */
  static create(
    id: string,
    userId: string,
    method: VerificationMethod,
    providerSessionId?: string
  ): AgeVerification {
    const now = new Date();

    return new AgeVerification({
      id,
      userId,
      status: 'pending',
      method,
      providerSessionId,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: AgeVerificationProps): AgeVerification {
    return new AgeVerification(props);
  }

  toJSON() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      status: this.props.status,
      method: this.props.method,
      verifiedAt: this.props.verifiedAt?.toISOString(),
      expiresAt: this.props.expiresAt?.toISOString(),
      providerSessionId: this.props.providerSessionId,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    };
  }
}
