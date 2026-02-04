/**
 * Login User Use Case
 *
 * Orchestrates the login flow:
 * 1. Validates input
 * 2. Finds user by email
 * 3. Validates password
 * 4. Creates session with refresh token
 * 5. Generates access and refresh tokens
 * 6. Returns tokens and user data
 */

import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface';
import type { ISessionRepository } from '../../repositories/interfaces/session.repository.interface';
import { AuthenticationError } from '../../domain/errors/AuthenticationError';
import { ValidationError } from '../../domain/errors/ValidationError';
import { PasswordService, JWTService } from '@anplexa/services';

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}

export class LoginUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JWTService
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    // 1. Validate input
    await this.validateInput(request);

    // 2. Find user by email
    const user = await this.userRepository.getByEmail(request.email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // 3. Validate password
    const isValidPassword = await this.passwordService.verifyPassword(
      request.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    // 4. Generate JWT tokens
    const tokens = this.jwtService.generateTokenPair(
      user.id,
      user.email,
      user.isAdmin || false
    );

    // 5. Create session with refresh token
    const refreshExpiresAt = this.jwtService.getRefreshExpiryDate();
    await this.sessionRepository.create({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      expiresAt: refreshExpiresAt.toISOString(),
    });

    // 6. Return response with tokens and user data
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      email: user.email,
    };
  }

  /**
   * Validate login input
   */
  private async validateInput(request: LoginUserRequest): Promise<void> {
    // Validate email
    if (!request.email || typeof request.email !== 'string') {
      throw new ValidationError('Email is required', 'email');
    }

    if (request.email.trim().length === 0) {
      throw new ValidationError('Email cannot be empty', 'email');
    }

    // Validate password
    if (!request.password || typeof request.password !== 'string') {
      throw new ValidationError('Password is required', 'password');
    }

    if (request.password.length === 0) {
      throw new ValidationError('Password cannot be empty', 'password');
    }
  }
}
