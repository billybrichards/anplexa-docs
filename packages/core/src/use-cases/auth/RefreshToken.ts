/**
 * Refresh Token Use Case
 *
 * Orchestrates the token refresh flow:
 * 1. Validates input
 * 2. Verifies refresh token JWT signature
 * 3. Finds associated session in database
 * 4. Checks if session is expired
 * 5. Finds user
 * 6. Generates new access token
 * 7. Rotates refresh token for security
 * 8. Returns new tokens
 */

import type { ISessionRepository } from '../../repositories/interfaces/session.repository.interface';
import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface';
import { AuthenticationError } from '../../domain/errors/AuthenticationError';
import { ValidationError } from '../../domain/errors/ValidationError';
import { JWTService } from '@anplexa/services';

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export class RefreshToken {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JWTService
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    // 1. Validate input
    await this.validateInput(request);

    // 2. Verify refresh token JWT signature and extract payload
    const tokenPayload = this.jwtService.verifyRefreshToken(request.refreshToken);
    if (!tokenPayload) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // 3. Find session by refresh token
    const session = await this.sessionRepository.getByRefreshToken(request.refreshToken);
    if (!session) {
      throw new AuthenticationError('Session not found');
    }

    // 4. Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    if (now >= expiresAt) {
      // Clean up expired session
      await this.sessionRepository.delete(session.id);
      throw new AuthenticationError('Session expired');
    }

    // 5. Find user to get current data (email, isAdmin status)
    const user = await this.userRepository.getById(session.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // 6. Generate new access token and rotate refresh token
    const tokens = this.jwtService.generateTokenPair(
      user.id,
      user.email,
      user.isAdmin || false
    );

    // 7. Rotate refresh token for security
    // Delete old session and create new one with new refresh token
    const refreshExpiresAt = this.jwtService.getRefreshExpiryDate();
    await this.sessionRepository.delete(session.id);
    await this.sessionRepository.create({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      expiresAt: refreshExpiresAt.toISOString(),
    });

    // 8. Return new tokens
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Validate refresh token input
   */
  private async validateInput(request: RefreshTokenRequest): Promise<void> {
    if (!request.refreshToken || typeof request.refreshToken !== 'string') {
      throw new ValidationError('Refresh token is required', 'refreshToken');
    }

    if (request.refreshToken.trim().length === 0) {
      throw new ValidationError('Refresh token cannot be empty', 'refreshToken');
    }
  }
}
