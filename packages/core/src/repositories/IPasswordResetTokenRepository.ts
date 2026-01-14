import type { PasswordResetToken, CreatePasswordResetTokenData } from '../domain/PasswordResetToken';

/**
 * Password Reset Token Repository Interface
 * Defines the contract for password reset token data access operations
 */
export interface IPasswordResetTokenRepository {
  /**
   * Find a password reset token by token hash
   * @param tokenHash - Token hash
   * @returns Token if found and not used, null otherwise
   */
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;

  /**
   * Create a new password reset token
   * @param data - Token creation data
   * @returns Created token
   */
  create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken>;

  /**
   * Mark a token as used
   * @param id - Token ID
   * @returns Updated token
   */
  markAsUsed(id: string): Promise<PasswordResetToken>;

  /**
   * Delete all tokens for a user
   * @param userId - User ID
   * @returns Number of tokens deleted
   */
  deleteByUserId(userId: string): Promise<number>;

  /**
   * Delete expired tokens
   * @returns Number of tokens deleted
   */
  deleteExpired(): Promise<number>;
}
