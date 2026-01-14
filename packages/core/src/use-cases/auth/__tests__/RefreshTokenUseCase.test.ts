/**
 * RefreshTokenUseCase Tests
 *
 * Integration tests for the RefreshTokenUseCase.
 * Tests all success and error scenarios with mocked repositories and services.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RefreshTokenUseCase } from '../RefreshTokenUseCase';
import type { IUserRepository } from '../../../repositories/IUserRepository';
import type { ISessionRepository } from '../../../repositories/ISessionRepository';
import { User } from '../../../domain/entities/User';
import { Session } from '../../../domain/entities/Session';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { AuthenticationError } from '../../../domain/errors/AuthenticationError';
import { JWTService } from '@anplexa/services';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockUserRepo: IUserRepository;
  let mockSessionRepo: ISessionRepository;
  let mockJwtService: JWTService;

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
    accessToken: 'new_access_token_123',
    refreshToken: 'new_refresh_token_123',
  };

  const mockSession = Session.create({
    id: 'session-123',
    userId: 'user-123',
    refreshToken: 'old_refresh_token',
    expiresAt: new Date('2099-12-31'), // Far future to avoid expiry issues
    createdAt: new Date('2024-01-01'),
    isActive: true,
  });

  const mockTokenPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    isAdmin: false,
  };

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

    useCase = new RefreshTokenUseCase(
      mockSessionRepo,
      mockUserRepo,
      mockJwtService
    );
  });

  describe('Success scenarios', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      // Arrange
      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepo.findByRefreshToken).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2025-01-01')
      );
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      const result = await useCase.execute({
        refreshToken: 'old_refresh_token',
      });

      // Assert
      expect(result.tokens).toEqual(mockTokens);
      expect(mockJwtService.verifyRefreshToken).toHaveBeenCalledWith('old_refresh_token');
      expect(mockSessionRepo.findByRefreshToken).toHaveBeenCalledWith(
        'old_refresh_token'
      );
      expect(mockUserRepo.findById).toHaveBeenCalledWith('user-123');
      expect(mockJwtService.generateTokenPair).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        false
      );
    });

    it('should update session with new refresh token', async () => {
      // Arrange
      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepo.findByRefreshToken).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2025-01-01')
      );
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      await useCase.execute({
        refreshToken: 'old_refresh_token',
      });

      // Assert
      const savedSession = vi.mocked(mockSessionRepo.save).mock.calls[0][0];
      expect(savedSession.refreshToken).toBe('new_refresh_token_123');
      expect(savedSession.expiresAt).toEqual(new Date('2025-01-01'));
    });

    it('should handle admin user token refresh', async () => {
      // Arrange
      const adminUser = User.create({
        ...mockUser,
        isAdmin: true,
      });
      const adminPayload = { ...mockTokenPayload, isAdmin: true };

      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(adminPayload);
      vi.mocked(mockSessionRepo.findByRefreshToken).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepo.findById).mockResolvedValue(adminUser);
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2025-01-01')
      );
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      await useCase.execute({
        refreshToken: 'old_refresh_token',
      });

      // Assert
      expect(mockJwtService.generateTokenPair).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        true
      );
    });

    it('should preserve session ID and userId', async () => {
      // Arrange
      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepo.findByRefreshToken).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2025-01-01')
      );
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      await useCase.execute({
        refreshToken: 'old_refresh_token',
      });

      // Assert
      const savedSession = vi.mocked(mockSessionRepo.save).mock.calls[0][0];
      expect(savedSession.id).toBe('session-123');
      expect(savedSession.userId).toBe('user-123');
    });
  });

  describe('Validation error scenarios', () => {
    it('should throw ValidationError for missing refresh token', async () => {
      // Act & Assert - Empty string
      await expect(
        useCase.execute({
          refreshToken: '',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          refreshToken: '',
        })
      ).rejects.toThrow('Refresh token is required');

      expect(mockJwtService.verifyRefreshToken).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for non-string refresh token', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          refreshToken: null as any,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          refreshToken: null as any,
        })
      ).rejects.toThrow('Refresh token is required');

      expect(mockJwtService.verifyRefreshToken).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only refresh token', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          refreshToken: '   ',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({
          refreshToken: '   ',
        })
      ).rejects.toThrow('Refresh token cannot be empty');

      expect(mockJwtService.verifyRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('Authentication error scenarios', () => {
    it('should throw AuthenticationError for invalid token signature', async () => {
      // Arrange
      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          refreshToken: 'invalid_token',
        })
      ).rejects.toThrow(AuthenticationError);

      await expect(
        useCase.execute({
          refreshToken: 'invalid_token',
        })
      ).rejects.toThrow('Invalid or expired refresh token');

      expect(mockSessionRepo.findByRefreshToken).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError when session not found', async () => {
      // Arrange
      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepo.findByRefreshToken).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          refreshToken: 'valid_token',
        })
      ).rejects.toThrow(AuthenticationError);

      await expect(
        useCase.execute({
          refreshToken: 'valid_token',
        })
      ).rejects.toThrow('Session not found');

      expect(mockUserRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError and invalidate session when expired', async () => {
      // Arrange
      const expiredSession = Session.create({
        ...mockSession,
        expiresAt: new Date('2020-01-01'), // Expired
      });
      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepo.findByRefreshToken).mockResolvedValue(expiredSession);

      // Act & Assert
      await expect(
        useCase.execute({
          refreshToken: 'expired_token',
        })
      ).rejects.toThrow(AuthenticationError);

      await expect(
        useCase.execute({
          refreshToken: 'expired_token',
        })
      ).rejects.toThrow('Session expired');

      expect(mockSessionRepo.invalidate).toHaveBeenCalledWith('session-123');
      expect(mockUserRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError and invalidate session when inactive', async () => {
      // Arrange
      const inactiveSession = Session.create({
        ...mockSession,
        isActive: false,
      });
      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepo.findByRefreshToken).mockResolvedValue(inactiveSession);

      // Act & Assert
      await expect(
        useCase.execute({
          refreshToken: 'inactive_token',
        })
      ).rejects.toThrow(AuthenticationError);

      await expect(
        useCase.execute({
          refreshToken: 'inactive_token',
        })
      ).rejects.toThrow('Session expired');

      expect(mockSessionRepo.invalidate).toHaveBeenCalledWith('session-123');
      expect(mockUserRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError and invalidate session when user not found', async () => {
      // Arrange
      const validSession = Session.create({
        ...mockSession,
        expiresAt: new Date('2099-12-31'), // Ensure not expired
      });
      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepo.findByRefreshToken).mockResolvedValue(validSession);
      vi.mocked(mockUserRepo.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          refreshToken: 'valid_token',
        })
      ).rejects.toThrow(AuthenticationError);

      await expect(
        useCase.execute({
          refreshToken: 'valid_token',
        })
      ).rejects.toThrow('User not found');

      expect(mockSessionRepo.invalidate).toHaveBeenCalledWith('session-123');
      expect(mockJwtService.generateTokenPair).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle session expiring at exact current time', async () => {
      // Arrange
      const now = new Date();
      const sessionExpiringNow = Session.create({
        ...mockSession,
        expiresAt: now,
      });

      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepo.findByRefreshToken).mockResolvedValue(
        sessionExpiringNow
      );

      // Act & Assert
      await expect(
        useCase.execute({
          refreshToken: 'token',
        })
      ).rejects.toThrow(AuthenticationError);

      expect(mockSessionRepo.invalidate).toHaveBeenCalled();
    });

    it('should handle very long refresh token', async () => {
      // Arrange
      const longToken = 'a'.repeat(1000);
      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepo.findByRefreshToken).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2025-01-01')
      );
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      await useCase.execute({
        refreshToken: longToken,
      });

      // Assert
      expect(mockJwtService.verifyRefreshToken).toHaveBeenCalledWith(longToken);
    });

    it('should handle multiple token refresh requests sequentially', async () => {
      // Arrange
      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepo.findByRefreshToken).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
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
        new Date('2025-01-01')
      );
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      const result1 = await useCase.execute({
        refreshToken: 'old_token',
      });

      const result2 = await useCase.execute({
        refreshToken: 'old_token',
      });

      // Assert
      expect(result1.tokens.accessToken).toBe('access_1');
      expect(result2.tokens.accessToken).toBe('access_2');
      expect(mockSessionRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should handle token with special characters', async () => {
      // Arrange
      const specialToken = 'abc.def-ghi_jkl=mno';
      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepo.findByRefreshToken).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(
        new Date('2025-01-01')
      );
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      await useCase.execute({
        refreshToken: specialToken,
      });

      // Assert
      expect(mockJwtService.verifyRefreshToken).toHaveBeenCalledWith(specialToken);
    });

    it('should update session expiry to future date', async () => {
      // Arrange
      const futureDate = new Date('2030-01-01');
      vi.mocked(mockJwtService.verifyRefreshToken).mockReturnValue(mockTokenPayload);
      vi.mocked(mockSessionRepo.findByRefreshToken).mockResolvedValue(mockSession);
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser);
      vi.mocked(mockJwtService.generateTokenPair).mockReturnValue(mockTokens);
      vi.mocked(mockJwtService.getRefreshExpiryDate).mockReturnValue(futureDate);
      vi.mocked(mockSessionRepo.save).mockResolvedValue(mockSession);

      // Act
      await useCase.execute({
        refreshToken: 'old_token',
      });

      // Assert
      const savedSession = vi.mocked(mockSessionRepo.save).mock.calls[0][0];
      expect(savedSession.expiresAt).toEqual(futureDate);
    });
  });
});
