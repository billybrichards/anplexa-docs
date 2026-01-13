/**
 * Refresh Token Use Case
 *
 * Handles token refresh business logic:
 * - Validates refresh token
 * - Fetches session via repository
 * - Verifies session validity
 * - Generates new access token
 * - Returns new token pair
 */

import type { ISessionRepository } from '../../repositories/ISessionRepository';
import type { IUserRepository } from '../../repositories/IUserRepository';
import { AuthenticationError } from '../../domain/errors/AuthenticationError';
import { ValidationError } from '../../domain/errors/ValidationError';
import { JWTService } from '@anplexa/services';
import type { TokenPair } from '@anplexa/services';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  tokens: TokenPair;
}

/**
 * Refresh Token Use Case
 *
 * Validates a refresh token and issues a new access/refresh token pair.
 * This allows users to maintain authenticated sessions without re-entering credentials.
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JWTService
  ) {}

  /**
   * Execute the refresh token use case
   * @param input - Refresh token input
   * @returns New authentication tokens
   * @throws ValidationError if input is invalid
   * @throws AuthenticationError if token is invalid or session expired
   */
  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Verify refresh token signature
    const payload = this.jwtService.verifyRefreshToken(input.refreshToken);
    if (!payload) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // 3. Find session by refresh token
    const session = await this.sessionRepository.findByRefreshToken(
      input.refreshToken
    );

    if (!session) {
      throw new AuthenticationError('Session not found');
    }

    // 4. Verify session validity
    if (!session.isValid()) {
      // Invalidate expired session
      await this.sessionRepository.invalidate(session.id);
      throw new AuthenticationError('Session expired');
    }

    // 5. Verify user still exists
    const user = await this.userRepository.findById(session.userId);
    if (!user) {
      await this.sessionRepository.invalidate(session.id);
      throw new AuthenticationError('User not found');
    }

    // 6. Generate new token pair
    const tokens = this.jwtService.generateTokenPair(
      user.id,
      user.email,
      user.isAdmin
    );

    // 7. Update session with new refresh token
    const updatedSession = {
      ...session,
      refreshToken: tokens.refreshToken,
      expiresAt: this.jwtService.getRefreshExpiryDate(),
    };

    await this.sessionRepository.save(updatedSession);

    // 8. Return new tokens
    return { tokens };
  }

  /**
   * Validate refresh token input
   * @param input - Refresh token input
   * @throws ValidationError if validation fails
   */
  private validateInput(input: RefreshTokenInput): void {
    if (!input.refreshToken || typeof input.refreshToken !== 'string') {
      throw new ValidationError('Refresh token is required', 'refreshToken');
    }

    if (input.refreshToken.trim().length === 0) {
      throw new ValidationError('Refresh token cannot be empty', 'refreshToken');
    }
  }
}
