/**
 * Password Reset Token Domain Entity
 * Represents a password reset token for user authentication
 */
export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

/**
 * Data required to create a new password reset token
 */
export interface CreatePasswordResetTokenData {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
}
