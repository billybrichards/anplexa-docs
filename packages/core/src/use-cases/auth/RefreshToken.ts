/**
 * Refresh Token Use Case
 *
 * Orchestrates the token refresh flow:
 * 1. Validates refresh token
 * 2. Checks session validity
 * 3. Generates new access token
 * 4. Optionally rotates refresh token
 */

import type { ISessionRepository } from '../../repositories/interfaces/session.repository.interface.js';
import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface.js';
import { AuthenticationError } from '../../domain/errors/AuthenticationError';

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
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    // TODO: Implement refresh token logic
    // 1. Find session by refresh token
    // 2. Validate session is active and not expired
    // 3. Load user
    // 4. Generate new access token
    // 5. Optionally rotate refresh token
    // 6. Return response
    throw new Error('RefreshToken.execute() must be implemented');
  }
}
