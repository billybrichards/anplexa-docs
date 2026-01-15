/**
 * ResetPasswordUseCase Tests
 *
 * Tests the password reset business logic including:
 * - Token validation
 * - Password strength validation
 * - User password update
 * - Session invalidation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResetPasswordUseCase } from '../../auth/ResetPasswordUseCase';
import type { IUserRepository } from '../../../repositories/interfaces/user.repository.interface';
import type { ISessionRepository } from '../../../repositories/interfaces/session.repository.interface';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { AuthenticationError } from '../../../domain/errors/AuthenticationError';
import type { User } from '@anplexa/database';

// Mock PasswordService
const mockPasswordService = {
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  validatePasswordStrength: vi.fn(),
};

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let mockUserRepository: IUserRepository;
  let mockSessionRepository: ISessionRepository;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'old-hash',
    displayName: 'Test User',
    chatName: null,
    personalityMode: null,
    storagePreference: null,
    isAdmin: false,
    subscriptionStatus: 'not_subscribed',
    credits: 0,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    accountSource: 'direct',
    sourceChannel: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    mockUserRepository = {
      getById: vi.fn(),
      getByEmail: vi.fn(),
      getByStripeCustomerId: vi.fn(),
      getByStripeSubscriptionId: vi.fn(),
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      save: undefined as any, // Start with undefined to test update path
    };

    mockSessionRepository = {
      getByUserId: vi.fn(),
      getByRefreshToken: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteExpired: vi.fn(),
      invalidateAll: vi.fn(),
    };

    // Reset mocks
    mockPasswordService.hashPassword.mockReset();
    mockPasswordService.verifyPassword.mockReset();
    mockPasswordService.validatePasswordStrength.mockReset();

    useCase = new ResetPasswordUseCase(
      mockUserRepository,
      mockSessionRepository,
      mockPasswordService as any
    );
  });

  describe('execute', () => {
    const validInput = {
      token: 'valid-token',
      tokenHash: 'hashed-token',
      userId: 'user-123',
      newPassword: 'NewSecureP@ssw0rd',
    };

    it('should successfully reset password with valid input', async () => {
      // Setup mocks
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      mockPasswordService.validatePasswordStrength.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockPasswordService.hashPassword.mockResolvedValue('new-hashed-password');
      vi.mocked(mockUserRepository.update).mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hashed-password',
      });

      // Execute
      const result = await useCase.execute(validInput);

      // Verify
      expect(result.success).toBe(true);
      expect(result.message).toContain('Password reset successfully');
      expect(mockPasswordService.validatePasswordStrength).toHaveBeenCalledWith(validInput.newPassword);
      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(validInput.token, validInput.tokenHash);
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(validInput.newPassword);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        validInput.userId,
        expect.objectContaining({
          passwordHash: 'new-hashed-password',
        })
      );
      expect(mockSessionRepository.invalidateAll).toHaveBeenCalledWith(mockUser.id);
    });

    it('should use save method if available instead of update', async () => {
      // Setup mocks - add save method for this test
      mockUserRepository.save = vi.fn().mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hashed-password',
      });
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      mockPasswordService.validatePasswordStrength.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockPasswordService.hashPassword.mockResolvedValue('new-hashed-password');

      // Execute
      const result = await useCase.execute(validInput);

      // Verify
      expect(result.success).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: 'new-hashed-password',
        })
      );
    });

    it('should throw ValidationError for missing token', async () => {
      const invalidInput = {
        ...validInput,
        token: '',
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(invalidInput)).rejects.toThrow('Reset token cannot be empty');
    });

    it('should throw ValidationError for missing tokenHash', async () => {
      const invalidInput = {
        ...validInput,
        tokenHash: '',
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing userId', async () => {
      const invalidInput = {
        ...validInput,
        userId: '',
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing newPassword', async () => {
      const invalidInput = {
        ...validInput,
        newPassword: '',
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for weak password', async () => {
      mockPasswordService.validatePasswordStrength.mockReturnValue({
        valid: false,
        errors: ['Password must be at least 8 characters long'],
      });

      const invalidInput = {
        ...validInput,
        newPassword: 'weak',
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(invalidInput)).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should throw AuthenticationError for invalid token', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      mockPasswordService.validatePasswordStrength.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockPasswordService.verifyPassword.mockResolvedValue(false);

      await expect(useCase.execute(validInput)).rejects.toThrow(AuthenticationError);
      await expect(useCase.execute(validInput)).rejects.toThrow('Invalid reset token');
    });

    it('should throw AuthenticationError when user not found', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(null);
      mockPasswordService.validatePasswordStrength.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);

      await expect(useCase.execute(validInput)).rejects.toThrow(AuthenticationError);
      await expect(useCase.execute(validInput)).rejects.toThrow('User not found');
    });

    it('should handle repository errors gracefully', async () => {
      vi.mocked(mockUserRepository.getById).mockRejectedValue(new Error('Database error'));
      mockPasswordService.validatePasswordStrength.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);

      await expect(useCase.execute(validInput)).rejects.toThrow('Database error');
    });

    it('should handle password hashing errors', async () => {
      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      mockPasswordService.validatePasswordStrength.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockPasswordService.hashPassword.mockRejectedValue(new Error('Hashing failed'));

      await expect(useCase.execute(validInput)).rejects.toThrow('Hashing failed');
    });

    it('should not invalidate sessions if invalidateAll method is not available', async () => {
      // Create repository without invalidateAll method
      const repoWithoutInvalidate = {
        ...mockSessionRepository,
        invalidateAll: undefined,
      };

      useCase = new ResetPasswordUseCase(
        mockUserRepository,
        repoWithoutInvalidate as any,
        mockPasswordService as any
      );

      vi.mocked(mockUserRepository.getById).mockResolvedValue(mockUser);
      mockPasswordService.validatePasswordStrength.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockPasswordService.hashPassword.mockResolvedValue('new-hashed-password');
      vi.mocked(mockUserRepository.update).mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hashed-password',
      });

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(mockSessionRepository.invalidateAll).not.toHaveBeenCalled();
    });
  });

  describe('input validation edge cases', () => {
    it('should reject non-string token', async () => {
      const invalidInput = {
        token: null as any,
        tokenHash: 'hash',
        userId: 'user-123',
        newPassword: 'NewPassword123!',
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('should reject non-string tokenHash', async () => {
      const invalidInput = {
        token: 'token',
        tokenHash: null as any,
        userId: 'user-123',
        newPassword: 'NewPassword123!',
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('should reject non-string userId', async () => {
      const invalidInput = {
        token: 'token',
        tokenHash: 'hash',
        userId: null as any,
        newPassword: 'NewPassword123!',
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('should reject non-string newPassword', async () => {
      const invalidInput = {
        token: 'token',
        tokenHash: 'hash',
        userId: 'user-123',
        newPassword: null as any,
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(ValidationError);
    });
  });
});
