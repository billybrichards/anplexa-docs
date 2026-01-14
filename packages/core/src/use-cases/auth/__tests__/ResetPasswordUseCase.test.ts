/**
 * ResetPasswordUseCase Tests
 *
 * Integration tests for the ResetPasswordUseCase.
 * Tests all success and error scenarios with mocked repositories and services.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResetPasswordUseCase } from '../ResetPasswordUseCase';
import type { IUserRepository } from '../../../repositories/IUserRepository';
import type { ISessionRepository } from '../../../repositories/ISessionRepository';
import { User } from '../../../domain/entities/User';
import { Session } from '../../../domain/entities/Session';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { AuthenticationError } from '../../../domain/errors/AuthenticationError';
import { PasswordService } from '@anplexa/services';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let mockUserRepo: IUserRepository;
  let mockSessionRepo: ISessionRepository;
  let mockPasswordService: PasswordService;

  const mockUser = User.create({
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'old_hashed_password',
    displayName: 'Test User',
    isVerified: true,
    isAdmin: false,
    credits: 10,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

  const mockActiveSessions = [
    Session.create({
      id: 'session-1',
      userId: 'user-123',
      refreshToken: 'token-1',
      expiresAt: new Date('2024-12-31'),
      createdAt: new Date('2024-01-01'),
      isActive: true,
    }),
    Session.create({
      id: 'session-2',
      userId: 'user-123',
      refreshToken: 'token-2',
      expiresAt: new Date('2024-12-31'),
      createdAt: new Date('2024-01-02'),
      isActive: true,
    }),
  ];

  beforeEach(() => {
    // Setup mock repositories
    mockUserRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      emailExists: vi.fn(),
    };

    mockSessionRepo = {
      findById: vi.fn(),
      findActiveByUserId: vi.fn(),
      save: vi.fn(),
      invalidate: vi.fn(),
      invalidateAll: vi.fn(),
      findByRefreshToken: vi.fn(),
    };

    // Setup mock services
    mockPasswordService = {
      hashPassword: vi.fn(),
      verifyPassword: vi.fn(),
      validatePasswordStrength: vi.fn(),
    } as any;

    useCase = new ResetPasswordUseCase(
      mockUserRepo,
      mockSessionRepo,
      mockPasswordService
    );
  });

  describe('Success scenarios', () => {
    it('should successfully reset password with valid token', async () => {
      // Arrange
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(
        'new_hashed_password'
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute({
        token: 'valid_reset_token',
        tokenHash: 'hashed_token',
        userId: 'user-123',
        newPassword: 'NewSecurePassword123!',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Password reset successfully. Please log in with your new password.'
      );
      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(
        'valid_reset_token',
        'hashed_token'
      );
      expect(mockUserRepo.findById).toHaveBeenCalledWith('user-123');
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(
        'NewSecurePassword123!'
      );
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mockSessionRepo.invalidateAll).toHaveBeenCalledWith('user-123');
    });

    it('should hash new password correctly', async () => {
      // Arrange
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(
        'new_hashed_password'
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);

      // Act
      await useCase.execute({
        token: 'valid_reset_token',
        tokenHash: 'hashed_token',
        userId: 'user-123',
        newPassword: 'NewSecurePassword123!',
      });

      // Assert
      const savedUser = vi.mocked(mockUserRepo.save).mock.calls[0][0];
      expect(savedUser.passwordHash).toBe('new_hashed_password');
    });

    it('should update user updatedAt timestamp', async () => {
      // Arrange
      const beforeUpdate = new Date();
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(
        'new_hashed_password'
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);

      // Act
      await useCase.execute({
        token: 'valid_reset_token',
        tokenHash: 'hashed_token',
        userId: 'user-123',
        newPassword: 'NewSecurePassword123!',
      });

      // Assert
      const savedUser = vi.mocked(mockUserRepo.save).mock.calls[0][0];
      expect(savedUser.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime()
      );
    });

    it('should invalidate all user sessions after password reset', async () => {
      // Arrange
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(
        'new_hashed_password'
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);

      // Act
      await useCase.execute({
        token: 'valid_reset_token',
        tokenHash: 'hashed_token',
        userId: 'user-123',
        newPassword: 'NewSecurePassword123!',
      });

      // Assert
      expect(mockSessionRepo.invalidateAll).toHaveBeenCalledWith('user-123');
      expect(mockSessionRepo.invalidateAll).toHaveBeenCalledTimes(1);
    });

    it('should preserve user email and other data', async () => {
      // Arrange
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(
        'new_hashed_password'
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);

      // Act
      await useCase.execute({
        token: 'valid_reset_token',
        tokenHash: 'hashed_token',
        userId: 'user-123',
        newPassword: 'NewSecurePassword123!',
      });

      // Assert
      const savedUser = vi.mocked(mockUserRepo.save).mock.calls[0][0];
      expect(savedUser.id).toBe('user-123');
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.displayName).toBe('Test User');
      expect(savedUser.isAdmin).toBe(false);
      expect(savedUser.credits).toBe(10);
    });
  });

  describe('Validation error scenarios', () => {
    it('should throw ValidationError for missing token', async () => {
      // Arrange
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });

      // Act & Assert - Empty string triggers "is required"
      await expect(
        useCase.execute({
          token: '',
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          token: '',
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow('Reset token is required');

      expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for non-string token', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          token: null as any,
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          token: null as any,
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow('Reset token is required');
    });

    it('should throw ValidationError for whitespace-only token', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          token: '   ',
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          token: '   ',
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow('Reset token cannot be empty');
    });

    it('should throw ValidationError for missing tokenHash', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          token: 'valid_token',
          tokenHash: '',
          userId: 'user-123',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          token: 'valid_token',
          tokenHash: null as any,
          userId: 'user-123',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow('Token hash is required');
    });

    it('should throw ValidationError for missing userId', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          token: 'valid_token',
          tokenHash: 'hashed_token',
          userId: '',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          token: 'valid_token',
          tokenHash: 'hashed_token',
          userId: null as any,
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow('User ID is required');
    });

    it('should throw ValidationError for missing new password', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          token: 'valid_token',
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: '',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          token: 'valid_token',
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: null as any,
        })
      ).rejects.toThrow('New password is required');
    });

    it('should throw ValidationError for weak new password', async () => {
      // Arrange
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: false,
        errors: ['Password must be at least 8 characters long'],
      });

      // Act & Assert
      await expect(
        useCase.execute({
          token: 'valid_token',
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: 'weak',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          token: 'valid_token',
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: 'weak',
        })
      ).rejects.toThrow('Password must be at least 8 characters long');

      expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for password not meeting requirements', async () => {
      // Arrange
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: false,
        errors: ['Password must contain at least one uppercase letter'],
      });

      // Act & Assert
      await expect(
        useCase.execute({
          token: 'valid_token',
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: 'lowercase123!',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          token: 'valid_token',
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: 'lowercase123!',
        })
      ).rejects.toThrow('Password must contain at least one uppercase letter');
    });
  });

  describe('Authentication error scenarios', () => {
    it('should throw AuthenticationError for invalid reset token', async () => {
      // Arrange
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(false);

      // Act & Assert
      await expect(
        useCase.execute({
          token: 'invalid_token',
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: 'NewSecurePassword123!',
        })
      ).rejects.toThrow(AuthenticationError);

      await expect(
        useCase.execute({
          token: 'invalid_token',
          tokenHash: 'hashed_token',
          userId: 'user-123',
          newPassword: 'NewSecurePassword123!',
        })
      ).rejects.toThrow('Invalid reset token');

      expect(mockUserRepo.findById).not.toHaveBeenCalled();
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError when user not found', async () => {
      // Arrange
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockUserRepo.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          token: 'valid_token',
          tokenHash: 'hashed_token',
          userId: 'nonexistent-user',
          newPassword: 'NewSecurePassword123!',
        })
      ).rejects.toThrow(AuthenticationError);

      await expect(
        useCase.execute({
          token: 'valid_token',
          tokenHash: 'hashed_token',
          userId: 'nonexistent-user',
          newPassword: 'NewSecurePassword123!',
        })
      ).rejects.toThrow('User not found');

      expect(mockUserRepo.save).not.toHaveBeenCalled();
      expect(mockSessionRepo.invalidateAll).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError for token mismatch', async () => {
      // Arrange
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(false);

      // Act & Assert
      await expect(
        useCase.execute({
          token: 'token_a',
          tokenHash: 'hash_of_token_b',
          userId: 'user-123',
          newPassword: 'NewSecurePassword123!',
        })
      ).rejects.toThrow(AuthenticationError);

      expect(mockUserRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long password', async () => {
      // Arrange
      const longPassword = 'A1!' + 'a'.repeat(200);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(
        'new_hashed_password'
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute({
        token: 'valid_token',
        tokenHash: 'hashed_token',
        userId: 'user-123',
        newPassword: longPassword,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(longPassword);
    });

    it('should handle password with special characters', async () => {
      // Arrange
      const specialPassword = 'P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?';
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(
        'new_hashed_password'
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute({
        token: 'valid_token',
        tokenHash: 'hashed_token',
        userId: 'user-123',
        newPassword: specialPassword,
      });

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle user with multiple active sessions', async () => {
      // Arrange
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(
        'new_hashed_password'
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);
      vi.mocked(mockSessionRepo.findActiveByUserId).mockResolvedValue(
        mockActiveSessions
      );

      // Act
      await useCase.execute({
        token: 'valid_token',
        tokenHash: 'hashed_token',
        userId: 'user-123',
        newPassword: 'NewSecurePassword123!',
      });

      // Assert
      expect(mockSessionRepo.invalidateAll).toHaveBeenCalledWith('user-123');
    });

    it('should handle admin user password reset', async () => {
      // Arrange
      const adminUser = User.create({
        ...mockUser,
        isAdmin: true,
      });
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockUserRepo.findById).mockResolvedValue(adminUser);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(
        'new_hashed_password'
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(adminUser);

      // Act
      const result = await useCase.execute({
        token: 'valid_token',
        tokenHash: 'hashed_token',
        userId: 'admin-123',
        newPassword: 'NewSecurePassword123!',
      });

      // Assert
      expect(result.success).toBe(true);
      const savedUser = vi.mocked(mockUserRepo.save).mock.calls[0][0];
      expect(savedUser.isAdmin).toBe(true);
    });

    it('should handle token with special characters', async () => {
      // Arrange
      const specialToken = 'abc-def_ghi.jkl=mno+pqr';
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(
        'new_hashed_password'
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);

      // Act
      await useCase.execute({
        token: specialToken,
        tokenHash: 'hashed_token',
        userId: 'user-123',
        newPassword: 'NewSecurePassword123!',
      });

      // Assert
      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(
        specialToken,
        'hashed_token'
      );
    });

    it('should handle user with no active sessions', async () => {
      // Arrange
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(
        'new_hashed_password'
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);
      vi.mocked(mockSessionRepo.findActiveByUserId).mockResolvedValue([]);

      // Act
      const result = await useCase.execute({
        token: 'valid_token',
        tokenHash: 'hashed_token',
        userId: 'user-123',
        newPassword: 'NewSecurePassword123!',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockSessionRepo.invalidateAll).toHaveBeenCalledWith('user-123');
    });
  });
});
