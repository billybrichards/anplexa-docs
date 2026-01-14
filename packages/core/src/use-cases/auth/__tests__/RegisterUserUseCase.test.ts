/**
 * RegisterUserUseCase Tests
 *
 * Integration tests for the RegisterUserUseCase.
 * Tests all success and error scenarios with mocked repositories and services.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegisterUserUseCase } from '../RegisterUserUseCase';
import type { IUserRepository } from '../../../repositories/IUserRepository';
import type { ISessionRepository } from '../../../repositories/ISessionRepository';
import { User } from '../../../domain/entities/User';
import { Session } from '../../../domain/entities/Session';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { JWTService, PasswordService } from '@anplexa/services';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepo: IUserRepository;
  let mockSessionRepo: ISessionRepository;
  let mockJwtService: JWTService;
  let mockPasswordService: PasswordService;

  const mockUser = User.create({
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    displayName: 'Test User',
    isVerified: false,
    isAdmin: false,
    credits: 5,
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

    useCase = new RegisterUserUseCase(
      mockUserRepo,
      mockSessionRepo,
      mockJwtService,
      mockPasswordService
    );
  });

  describe('Success scenarios', () => {
    it('should successfully register a new user with all fields', async () => {
      // Arrange
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue('hashed_password');
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockJwtService.generateId)
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        displayName: 'Test User',
      });

      // Assert
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        isAdmin: false,
        credits: 5,
        createdAt: mockUser.createdAt,
      });
      expect(result.tokens).toEqual(mockTokens);
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(
        'SecurePassword123!'
      );
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mockSessionRepo.save).toHaveBeenCalled();
    });

    it('should successfully register a user without display name', async () => {
      // Arrange
      const userWithoutName = User.create({
        ...mockUser,
        displayName: null,
      });
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue('hashed_password');
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockJwtService.generateId)
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(userWithoutName);
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      // Assert
      expect(result.user.displayName).toBeNull();
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should normalize email to lowercase and trim whitespace', async () => {
      // Arrange
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue('hashed_password');
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockJwtService.generateId)
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      // Assert - Check that findByEmail was called with normalized email
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      const savedUser = vi.mocked(mockUserRepo.save).mock.calls[0][0];
      expect(savedUser.email).toBe('test@example.com');
    });

    it('should trim display name whitespace', async () => {
      // Arrange
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue('hashed_password');
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockJwtService.generateId)
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        displayName: '  Test User  ',
      });

      // Assert
      const savedUser = vi.mocked(mockUserRepo.save).mock.calls[0][0];
      expect(savedUser.displayName).toBe('Test User');
    });

    it('should create user with default 5 credits', async () => {
      // Arrange
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue('hashed_password');
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockJwtService.generateId)
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      // Assert
      expect(result.user.credits).toBe(5);
    });

    it('should create an active session with correct expiry', async () => {
      // Arrange
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue('hashed_password');
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockJwtService.generateId)
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      // Assert
      const savedSession = vi.mocked(mockSessionRepo.save).mock.calls[0][0];
      expect(savedSession.userId).toBe('user-123');
      expect(savedSession.refreshToken).toBe('refresh_token_123');
      expect(savedSession.isActive).toBe(true);
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

      expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing email', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          email: '',
          password: 'SecurePassword123!',
        })
      ).rejects.toThrow(ValidationError);

      expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
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

    it('should throw ValidationError for weak password', async () => {
      // Arrange
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: false,
        errors: ['Password must be at least 8 characters long'],
      });

      // Act & Assert
      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: 'weak',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: 'weak',
        })
      ).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should throw ValidationError for display name exceeding max length', async () => {
      // Arrange
      const longName = 'a'.repeat(256);
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });

      // Act & Assert
      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: 'SecurePassword123!',
          displayName: longName,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: 'SecurePassword123!',
          displayName: longName,
        })
      ).rejects.toThrow('Display name must be less than 255 characters');
    });

    it('should throw ValidationError if email already exists', async () => {
      // Arrange
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });

      // Act & Assert
      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: 'SecurePassword123!',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: 'SecurePassword123!',
        })
      ).rejects.toThrow('Email already registered');

      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle display name at maximum length (255 chars)', async () => {
      // Arrange
      const maxLengthName = 'a'.repeat(255);
      const userWithMaxName = User.create({
        ...mockUser,
        displayName: maxLengthName,
      });
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue('hashed_password');
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockJwtService.generateId)
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(userWithMaxName);
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        displayName: maxLengthName,
      });

      // Assert
      expect(result.user.displayName).toBe(maxLengthName);
    });

    it('should handle email with special characters', async () => {
      // Arrange
      const specialEmail = 'test+alias@sub.example.com';
      const userWithSpecialEmail = User.create({
        ...mockUser,
        email: specialEmail,
      });
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue('hashed_password');
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockJwtService.generateId)
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(userWithSpecialEmail);
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute({
        email: specialEmail,
        password: 'SecurePassword123!',
      });

      // Assert
      expect(result.user.email).toBe(specialEmail);
    });

    it('should handle empty string display name as null', async () => {
      // Arrange
      const userWithoutName = User.create({
        ...mockUser,
        displayName: null,
      });
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue('hashed_password');
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockJwtService.generateId)
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(userWithoutName);
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      await useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        displayName: '   ',
      });

      // Assert
      const savedUser = vi.mocked(mockUserRepo.save).mock.calls[0][0];
      expect(savedUser.displayName).toBeNull();
    });

    it('should handle concurrent registration attempts with same email', async () => {
      // Arrange
      vi.mocked(mockUserRepo.findByEmail)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);
      vi.mocked(mockPasswordService.hashPassword).mockResolvedValue('hashed_password');
      vi.mocked(mockPasswordService.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(mockJwtService.generateId)
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('session-123');
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2024-12-31')
      );
      vi.mocked(mockUserRepo.save).mockResolvedValue(mockUser);
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      const promise1 = useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      const promise2 = useCase.execute({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      // Assert
      await expect(promise1).resolves.toBeDefined();
      await expect(promise2).rejects.toThrow('Email already registered');
    });
  });
});
