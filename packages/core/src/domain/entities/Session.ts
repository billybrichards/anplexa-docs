/**
 * Session Domain Entity
 *
 * Represents an authenticated session for a user.
 * Used for tracking user login sessions and refresh tokens.
 */

export class Session {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly refreshToken: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date = new Date(),
    public readonly isActive: boolean = true
  ) {}

  /**
   * Check if the session has expired
   * @returns true if session has expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if the session is still valid
   * @returns true if session is valid (active and not expired)
   */
  isValid(): boolean {
    return this.isActive && !this.isExpired();
  }

  /**
   * Create a new session instance
   * @param data - Session creation data
   * @returns New Session instance
   */
  static create(data: {
    id: string;
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    createdAt?: Date;
    isActive?: boolean;
  }): Session {
    return new Session(
      data.id,
      data.userId,
      data.refreshToken,
      data.expiresAt,
      data.createdAt ?? new Date(),
      data.isActive ?? true
    );
  }
}
