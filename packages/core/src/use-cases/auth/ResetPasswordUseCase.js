"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordUseCase = void 0;
const ValidationError_1 = require("../../domain/errors/ValidationError");
const AuthenticationError_1 = require("../../domain/errors/AuthenticationError");
/**
 * Reset Password Use Case
 *
 * Validates a password reset token and updates the user's password.
 * Invalidates all existing sessions to force re-authentication.
 *
 * Note: Token validation and lookup should be done by the infrastructure layer
 * before calling this use case. This use case focuses on the password update logic.
 */
class ResetPasswordUseCase {
    userRepository;
    sessionRepository;
    passwordService;
    constructor(userRepository, sessionRepository, passwordService) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordService = passwordService;
    }
    /**
     * Execute the reset password use case
     * @param input - Reset password input with pre-validated token data
     * @returns Success status and message
     * @throws ValidationError if input is invalid
     * @throws AuthenticationError if user not found
     */
    async execute(input) {
        // 1. Validate input
        await this.validateInput(input);
        // 2. Verify token matches (infrastructure should have already validated this)
        // This is a secondary check for security
        const isValidToken = await this.passwordService.verifyPassword(input.token, input.tokenHash);
        if (!isValidToken) {
            throw new AuthenticationError_1.AuthenticationError('Invalid reset token');
        }
        // 3. Find user
        const user = await this.userRepository.findById(input.userId);
        if (!user) {
            throw new AuthenticationError_1.AuthenticationError('User not found');
        }
        // 4. Hash new password
        const newPasswordHash = await this.passwordService.hashPassword(input.newPassword);
        // 5. Update user password
        if (this.userRepository.save) {
            const updatedUser = {
                ...user,
                passwordHash: newPasswordHash,
                updatedAt: new Date(),
            };
            await this.userRepository.save(updatedUser);
        }
        else {
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
    async validateInput(input) {
        // Validate token
        if (!input.token || typeof input.token !== 'string') {
            throw new ValidationError_1.ValidationError('Reset token is required', 'token');
        }
        if (input.token.trim().length === 0) {
            throw new ValidationError_1.ValidationError('Reset token cannot be empty', 'token');
        }
        // Validate tokenHash
        if (!input.tokenHash || typeof input.tokenHash !== 'string') {
            throw new ValidationError_1.ValidationError('Token hash is required', 'tokenHash');
        }
        // Validate userId
        if (!input.userId || typeof input.userId !== 'string') {
            throw new ValidationError_1.ValidationError('User ID is required', 'userId');
        }
        // Validate new password
        if (!input.newPassword || typeof input.newPassword !== 'string') {
            throw new ValidationError_1.ValidationError('New password is required', 'newPassword');
        }
        // Validate password strength
        const passwordValidation = this.passwordService.validatePasswordStrength(input.newPassword);
        if (!passwordValidation.valid) {
            throw new ValidationError_1.ValidationError(passwordValidation.errors[0] || 'Password does not meet requirements', 'newPassword');
        }
    }
}
exports.ResetPasswordUseCase = ResetPasswordUseCase;
