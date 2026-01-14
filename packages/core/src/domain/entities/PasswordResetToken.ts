/**
 * PasswordResetToken Domain Entity
 *
 * Represents a password reset token for user authentication.
 * Used for tracking password reset requests and their expiration.
 */

export class PasswordResetToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly used: boolean,
    public readonly expiresAt: Date,
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * Check if the token has expired
   * @returns true if token has expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if the token is still valid
   * @returns true if token is valid (not used and not expired)
   */
  isValid(): boolean {
    return !this.used && !this.isExpired();
  }

  /**
   * Create a new password reset token instance
   * @param data - Token creation data
   * @returns New PasswordResetToken instance
   */
  static create(data: {
    id: string;
    userId: string;
    token: string;
    used?: boolean;
    expiresAt: Date;
    createdAt?: Date;
  }): PasswordResetToken {
    return new PasswordResetToken(
      data.id,
      data.userId,
      data.token,
      data.used ?? false,
      data.expiresAt,
      data.createdAt ?? new Date()
    );
  }
}
