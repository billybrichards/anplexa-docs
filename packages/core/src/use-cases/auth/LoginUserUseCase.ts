/**
 * Login User Use Case
 *
 * Handles user login business logic:
 * - Validates credentials
 * - Fetches user via repository
 * - Verifies password
 * - Generates JWT tokens
 * - Creates new session
 */

import type { IUserRepository } from '../../repositories/IUserRepository';
import type { ISessionRepository } from '../../repositories/ISessionRepository';
import { Session } from '../../domain/entities/Session';
import { AuthenticationError } from '../../domain/errors/AuthenticationError';
import { ValidationError } from '../../domain/errors/ValidationError';
import { JWTService, PasswordService } from '@anplexa/services';
import type { TokenPair } from '@anplexa/services';

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserOutput {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    isAdmin: boolean;
    credits: number;
    createdAt: Date;
  };
  tokens: TokenPair;
}

/**
 * Login User Use Case
 *
 * Orchestrates user authentication process including credential validation,
 * session creation, and token generation.
 */
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly jwtService: JWTService,
    private readonly passwordService: PasswordService
  ) {}

  /**
   * Execute the login use case
   * @param input - Login credentials
   * @returns User data and authentication tokens
   * @throws ValidationError if input is invalid
   * @throws AuthenticationError if credentials are incorrect
   */
  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Find user by email
    const user = await this.userRepository.findByEmail(
      input.email.toLowerCase().trim()
    );

    if (!user) {
      // Use generic message to prevent email enumeration
      throw new AuthenticationError('Invalid email or password');
    }

    // 3. Verify password
    const isValidPassword = await this.passwordService.verifyPassword(
      input.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // 4. Generate JWT tokens
    const tokens = this.jwtService.generateTokenPair(
      user.id,
      user.email,
      user.isAdmin
    );

    // 5. Create new session
    const sessionId = this.jwtService.generateId();
    const expiresAt = this.jwtService.getRefreshExpiryDate();
    const session = Session.create({
      id: sessionId,
      userId: user.id,
      refreshToken: tokens.refreshToken,
      expiresAt,
      createdAt: new Date(),
      isActive: true,
    });

    await this.sessionRepository.save(session);

    // 6. Return user data and tokens
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        credits: user.credits,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  /**
   * Validate login input
   * @param input - Login input data
   * @throws ValidationError if validation fails
   */
  private validateInput(input: LoginUserInput): void {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!input.email || !emailRegex.test(input.email)) {
      throw new ValidationError('Invalid email format', 'email');
    }

    // Validate password is provided
    if (!input.password || typeof input.password !== 'string') {
      throw new ValidationError('Password is required', 'password');
    }

    if (input.password.trim().length === 0) {
      throw new ValidationError('Password cannot be empty', 'password');
    }
  }
}
