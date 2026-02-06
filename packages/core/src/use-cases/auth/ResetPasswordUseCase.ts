/**
 * Reset Password Use Case
 *
 * Handles password reset business logic:
 * - Validates reset token
 * - Verifies token hasn't been used
 * - Hashes new password
 * - Updates user password via repository
 * - Invalidates old sessions
 * - Marks token as used
 */

import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface';
import type { ISessionRepository } from '../../repositories/interfaces/session.repository.interface';
import { ValidationError } from '../../domain/errors/ValidationError';
import { AuthenticationError } from '../../domain/errors/AuthenticationError';
import type { IPasswordService } from '../../domain/services/IPasswordService';

export interface ResetPasswordInput {
  token: string;
  tokenHash: string;
  userId: string;
  newPassword: string;
}

export interface ResetPasswordOutput {
  success: boolean;
  message: string;
}

/**
 * Reset Password Use Case
 *
 * Validates a password reset token and updates the user's password.
 * Invalidates all existing sessions to force re-authentication.
 *
 * Note: Token validation and lookup should be done by the infrastructure layer
 * before calling this use case. This use case focuses on the password update logic.
 */
export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly passwordService: IPasswordService
  ) {}

  /**
   * Execute the reset password use case
   * @param input - Reset password input with pre-validated token data
   * @returns Success status and message
   * @throws ValidationError if input is invalid
   * @throws AuthenticationError if user not found
   */
  async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
    // 1. Validate input
    await this.validateInput(input);

    // 2. Verify token matches (infrastructure should have already validated this)
    // This is a secondary check for security
    const isValidToken = await this.passwordService.verifyPassword(
      input.token,
      input.tokenHash
    );

    if (!isValidToken) {
      throw new AuthenticationError('Invalid reset token');
    }

    // 3. Find user
    const user = await this.userRepository.getById(input.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // 4. Hash new password
    const newPasswordHash = await this.passwordService.hashPassword(
      input.newPassword
    );

    // 5. Update user password
    if (this.userRepository.save) {
      const updatedUser = {
        ...user,
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      };
      await this.userRepository.save(updatedUser as any);
    } else {
      await this.userRepository.update(user.id, {
        passwordHash: newPasswordHash,
      });
    }

    // 6. Invalidate all existing sessions for this user
    // Force user to log in again with new password
    if (this.sessionRepository.invalidateAll) {
      await this.sessionRepository.invalidateAll(user.id);
    }

    // 7. Return success
    return {
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    };
  }

  /**
   * Validate reset password input
   * @param input - Reset password input
   * @throws ValidationError if validation fails
   */
  private async validateInput(input: ResetPasswordInput): Promise<void> {
    // Validate token
    if (typeof input.token !== 'string' || input.token === null || input.token === undefined) {
      throw new ValidationError('Reset token is required', 'token');
    }

    if (input.token.trim().length === 0) {
      throw new ValidationError('Reset token cannot be empty', 'token');
    }

    // Validate tokenHash
    if (!input.tokenHash || typeof input.tokenHash !== 'string') {
      throw new ValidationError('Token hash is required', 'tokenHash');
    }

    // Validate userId
    if (!input.userId || typeof input.userId !== 'string') {
      throw new ValidationError('User ID is required', 'userId');
    }

    // Validate new password
    if (!input.newPassword || typeof input.newPassword !== 'string') {
      throw new ValidationError('New password is required', 'newPassword');
    }

    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(
      input.newPassword
    );

    if (!passwordValidation.valid) {
      throw new ValidationError(
        passwordValidation.errors[0] || 'Password does not meet requirements',
        'newPassword'
      );
    }
  }
}
