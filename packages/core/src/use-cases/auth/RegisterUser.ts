/**
 * Register User Use Case
 *
 * Orchestrates the user registration flow:
 * 1. Validates input
 * 2. Checks if email already exists
 * 3. Hashes password
 * 4. Creates new user entity
 * 5. Persists user
 * 6. Creates session
 * 7. Generates JWT tokens
 * 8. Returns user data with tokens
 */

import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface.js';
import type { ISessionRepository } from '../../repositories/interfaces/session.repository.interface.js';
import { ValidationError } from '../../domain/errors/ValidationError.js';
import { AuthenticationError } from '../../domain/errors/AuthenticationError.js';
import type { IPasswordService } from '../../domain/services/IPasswordService.js';
import type { IJWTService } from '../../domain/services/IJWTService.js';

export interface RegisterUserRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface RegisterUserResponse {
  userId: string;
  email: string;
  displayName?: string;
  accessToken: string;
  refreshToken: string;
}

export class RegisterUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly passwordService: IPasswordService,
    private readonly jwtService: IJWTService
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // 1. Validate input
    await this.validateInput(request);

    // 2. Check if user already exists
    const existingUser = await this.userRepository.getByEmail(request.email);
    if (existingUser) {
      throw new AuthenticationError('Email already registered');
    }

    // 3. Hash password
    const passwordHash = await this.passwordService.hashPassword(request.password);

    // 4. Create user entity
    const userId = this.jwtService.generateId();
    const newUser = await this.userRepository.create({
      id: userId,
      email: request.email,
      passwordHash,
      displayName: request.displayName,
    });

    // 5. Generate JWT tokens
    const tokens = this.jwtService.generateTokenPair(
      newUser.id,
      newUser.email,
      false // isAdmin - default to false for new registrations
    );

    // 6. Create session with refresh token
    const refreshExpiresAt = this.jwtService.getRefreshExpiryDate();
    await this.sessionRepository.create({
      userId: newUser.id,
      refreshToken: tokens.refreshToken,
      expiresAt: refreshExpiresAt.toISOString(),
    });

    // 7. Return response with user data and tokens
    return {
      userId: newUser.id,
      email: newUser.email,
      displayName: newUser.displayName,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Validate registration input
   */
  private async validateInput(request: RegisterUserRequest): Promise<void> {
    // Validate email
    if (!request.email || typeof request.email !== 'string') {
      throw new ValidationError('Email is required', 'email');
    }

    if (request.email.trim().length === 0) {
      throw new ValidationError('Email cannot be empty', 'email');
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new ValidationError('Invalid email format', 'email');
    }

    // Validate password
    if (!request.password || typeof request.password !== 'string') {
      throw new ValidationError('Password is required', 'password');
    }

    if (request.password.length === 0) {
      throw new ValidationError('Password cannot be empty', 'password');
    }

    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(
      request.password
    );

    if (!passwordValidation.valid) {
      throw new ValidationError(
        passwordValidation.errors[0] || 'Password does not meet requirements',
        'password'
      );
    }
  }
}
