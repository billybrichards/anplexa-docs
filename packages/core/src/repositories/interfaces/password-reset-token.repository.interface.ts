/**
 * Password Reset Token Repository Interface
 *
 * Defines the contract for password reset token data persistence operations.
 * Part of the Clean Architecture domain layer - inner layers define the interface,
 * outer layers (infrastructure) implement it.
 */

import { PasswordResetToken } from '../../domain/entities/PasswordResetToken';

// Re-export PasswordResetToken for use by other modules
export { PasswordResetToken };

/**
 * Data required to create a new password reset token
 * Note: Uses string for expiresAt to match database storage format
 */
export interface CreatePasswordResetTokenData {
  userId: string;
  token: string;
  expiresAt: string; // ISO string
}

/**
 * Repository interface for password reset token persistence operations
 *
 * This interface follows the Repository pattern from Clean Architecture.
 * Infrastructure layer will provide concrete implementations.
 */
export interface IPasswordResetTokenRepository {
  /**
   * Creates a new password reset token
   * @param data - Data required to create the token
   * @returns Promise resolving to the created token
   */
  create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken>;

  /**
   * Finds a password reset token by its token value
   * @param token - The token string to search for
   * @returns Promise resolving to token or null if not found
   */
  getByToken(token: string): Promise<PasswordResetToken | null>;

  /**
   * Marks a password reset token as used
   * @param id - The token's unique identifier
   * @returns Promise that resolves when update is complete
   */
  markAsUsed(id: string): Promise<void>;

  /**
   * Gets all valid (non-expired, unused) password reset tokens
   * @returns Promise resolving to array of valid tokens
   */
  getAllValid(): Promise<PasswordResetToken[]>;

  /**
   * Removes all expired tokens from the database
   * Useful for periodic cleanup operations
   * @returns Promise resolving to the count of deleted tokens
   */
  deleteExpired(): Promise<number>;
}
