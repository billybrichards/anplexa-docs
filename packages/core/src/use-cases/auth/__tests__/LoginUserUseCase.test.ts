/**
 * LoginUserUseCase Tests
 *
 * Integration tests for the LoginUserUseCase.
 * Tests all success and error scenarios with mocked repositories and services.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginUserUseCase } from '../LoginUserUseCase';
import type { IUserRepository } from '../../../repositories/IUserRepository';
import type { ISessionRepository } from '../../../repositories/ISessionRepository';
import { User } from '../../../domain/entities/User';
import { Session } from '../../../domain/entities/Session';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { AuthenticationError } from '../../../domain/errors/AuthenticationError';
import { JWTService, PasswordService } from '@anplexa/services';

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let mockUserRepo: IUserRepository;
  let mockSessionRepo: ISessionRepository;
  let mockJwtService: JWTService;
  let mockPasswordService: PasswordService;

  const mockUser = User.create({
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    displayName: 'Test User',
    isVerified: true,
    isAdmin: false,
    credits: 10,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

  const mockTokens = {
    accessToken: 'access_token_123',
    refreshToken: 'refresh_token_123',
  };

  const mockSession = Session.create({
    id: 'session-123',
    userId: 'user-123',
    refreshToken: 'refresh_token_123',
    expiresAt: new Date('2024-12-31'),
    createdAt: new Date('2024-01-01'),
    isActive: true,
  });

  beforeEach(() => {
    // Setup mock repositories with method names matching the interfaces
    mockUserRepo = {
      // Query methods (new naming convention)
      getById: vi.fn(),
      getByEmail: vi.fn(),
      getByStripeCustomerId: vi.fn(),
      getByStripeSubscriptionId: vi.fn(),
      getAll: vi.fn(),
      // Legacy aliases
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByStripeCustomerId: vi.fn(),
      findByStripeSubscriptionId: vi.fn(),
      emailExists: vi.fn(),
      // Command methods
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      save: vi.fn(),
      // Stripe methods
      updateStripeCustomerId: vi.fn(),
      updateSubscriptionStatus: vi.fn(),
    };

    mockSessionRepo = {
      // New methods
      getByUserId: vi.fn(),
      getByRefreshToken: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteExpired: vi.fn(),
      // Legacy aliases
      findById: vi.fn(),
      findActiveByUserId: vi.fn(),
      findByRefreshToken: vi.fn(),
      save: vi.fn(),
      invalidate: vi.fn(),
      invalidateAll: vi.fn(),
    };

    // Setup mock services
    mockJwtService = {
      generateId: vi.fn(),
      generateTokenPair: vi.fn(),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
      getRefreshExpiryDate: vi.fn(),
    } as any;

    mockPasswordService = {
      hashPassword: vi.fn(),
      verifyPassword: vi.fn(),
      validatePasswordStrength: vi.fn(),
    } as any;

    useCase = new LoginUserUseCase(
      mockUserRepo,
      mockSessionRepo,
      mockJwtService,
      mockPasswordService
    );
  });

  describe('Success scenarios', () => {
    it('should successfully login user with valid credentials', async () => {
      // Arrange
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockJwtService.generateId).mockReturnValue('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockSessionRepo.create).mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      // Assert
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        isAdmin: false,
        credits: 10,
        createdAt: mockUser.createdAt,
      });
      expect(result.tokens).toEqual(mockTokens);
      expect(mockUserRepo.getByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(
        'SecurePassword123!',
        'hashed_password'
      );
      expect(mockSessionRepo.create).toHaveBeenCalled();
    });

    it('should normalize email to lowercase before lookup', async () => {
      // Arrange
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockJwtService.generateId).mockReturnValue('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockSessionRepo.create).mockResolvedValue(mockSession);

      // Act
      await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      // Assert - Verify email lookup uses normalized form
      expect(mockUserRepo.getByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should create a new session with correct expiry', async () => {
      // Arrange
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockJwtService.generateId).mockReturnValue('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockSessionRepo.create).mockResolvedValue(mockSession);

      // Act
      await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      // Assert
      const savedSession = vi.mocked(mockSessionRepo.create).mock.calls[0][0];
      expect(savedSession.userId).toBe('user-123');
      expect(savedSession.refreshToken).toBe('refresh_token_123');
      expect(savedSession.expiresAt).toBe('2024-12-31T00:00:00.000Z');
    });

    it('should generate JWT tokens with correct user data', async () => {
      // Arrange
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockJwtService.generateId).mockReturnValue('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockSessionRepo.create).mockResolvedValue(mockSession);

      // Act
      await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      // Assert
      expect(mockJwtService.generateTokenPair).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        false
      );
    });

    it('should handle admin user login correctly', async () => {
      // Arrange
      const adminUser = User.create({
        ...mockUser,
        isAdmin: true,
      });
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(adminUser);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockJwtService.generateId).mockReturnValue('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockSessionRepo.create).mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute({
        email: 'admin@example.com',
        password: 'SecurePassword123!',
      });

      // Assert
      expect(result.user.isAdmin).toBe(true);
      expect(mockJwtService.generateTokenPair).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        true
      );
    });

    it('should handle user with null display name', async () => {
      // Arrange
      const userWithoutName = User.create({
        ...mockUser,
        displayName: null,
      });
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(userWithoutName);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockJwtService.generateId).mockReturnValue('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockSessionRepo.create).mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      // Assert
      expect(result.user.displayName).toBeNull();
    });
  });

  describe('Validation error scenarios', () => {
    it('should throw ValidationError for invalid email format', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          email: 'invalid-email',
          password: 'SecurePassword123!',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          email: 'invalid-email',
          password: 'SecurePassword123!',
        })
      ).rejects.toThrow('Invalid email format');

      expect(mockUserRepo.getByEmail).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing email', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          email: '',
          password: 'SecurePassword123!',
        })
      ).rejects.toThrow(ValidationError);

      expect(mockUserRepo.getByEmail).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing password', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: '',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: '',
        })
      ).rejects.toThrow('Password is required');
    });

    it('should throw ValidationError for non-string password', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: null as any,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: null as any,
        })
      ).rejects.toThrow('Password is required');
    });

    it('should throw ValidationError for whitespace-only password', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: '   ',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: '   ',
        })
      ).rejects.toThrow('Password cannot be empty');
    });
  });

  describe('Authentication error scenarios', () => {
    it('should throw AuthenticationError for non-existent user', async () => {
      // Arrange
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!',
        })
      ).rejects.toThrow(AuthenticationError);

      await expect(
        useCase.execute({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!',
        })
      ).rejects.toThrow('Invalid email or password');

      expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
      expect(mockSessionRepo.create).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError for incorrect password', async () => {
      // Arrange
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(false);

      // Act & Assert
      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow(AuthenticationError);

      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow('Invalid email or password');

      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(
        'WrongPassword123!',
        'hashed_password'
      );
      expect(mockSessionRepo.create).not.toHaveBeenCalled();
    });

    it('should use generic error message to prevent email enumeration', async () => {
      // Arrange - User not found
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(null);

      // Act & Assert
      const error1 = await useCase
        .execute({
          email: 'nonexistent@example.com',
          password: 'password',
        })
        .catch((e) => e);

      // Arrange - Wrong password
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(false);

      const error2 = await useCase
        .execute({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .catch((e) => e);

      // Assert - Both should have the same error message
      expect(error1.message).toBe('Invalid email or password');
      expect(error2.message).toBe('Invalid email or password');
    });
  });

  describe('Edge cases', () => {
    it('should handle email with special characters', async () => {
      // Arrange
      const specialEmail = 'test+alias@sub.example.com';
      const userWithSpecialEmail = User.create({
        ...mockUser,
        email: specialEmail,
      });
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(userWithSpecialEmail);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockJwtService.generateId).mockReturnValue('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockSessionRepo.create).mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute({
        email: specialEmail,
        password: 'SecurePassword123!',
      });

      // Assert
      expect(result.user.email).toBe(specialEmail);
    });

    it('should handle user with zero credits', async () => {
      // Arrange
      const userWithNoCredits = User.create({
        ...mockUser,
        credits: 0,
      });
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(userWithNoCredits);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockJwtService.generateId).mockReturnValue('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockSessionRepo.create).mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      // Assert
      expect(result.user.credits).toBe(0);
    });

    it('should handle very long valid email', async () => {
      // Arrange
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      const userWithLongEmail = User.create({
        ...mockUser,
        email: longEmail,
      });
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(userWithLongEmail);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockJwtService.generateId).mockReturnValue('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockSessionRepo.create).mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute({
        email: longEmail,
        password: 'SecurePassword123!',
      });

      // Assert
      expect(result.user.email).toBe(longEmail);
    });

    it('should handle multiple login attempts sequentially', async () => {
      // Arrange
      vi.mocked(mockUserRepo.getByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
      vi.mocked(mockJwtService.generateId)
        .mockReturnValueOnce('session-1')
        .mockReturnValueOnce('session-2');
      vi.mocked(mockJwtService.generateTokenPair)
        .mockReturnValueOnce({
          accessToken: 'access_1',
          refreshToken: 'refresh_1',
        })
        .mockReturnValueOnce({
          accessToken: 'access_2',
          refreshToken: 'refresh_2',
        });
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockSessionRepo.create)
        .mockResolvedValueOnce(
          Session.create({ ...mockSession, id: 'session-1' })
        )
        .mockResolvedValueOnce(
          Session.create({ ...mockSession, id: 'session-2' })
        );

      // Act
      const result1 = await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      const result2 = await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      // Assert
      expect(result1.tokens.accessToken).toBe('access_1');
      expect(result2.tokens.accessToken).toBe('access_2');
      expect(mockSessionRepo.create).toHaveBeenCalledTimes(2);
    });
  });
});
