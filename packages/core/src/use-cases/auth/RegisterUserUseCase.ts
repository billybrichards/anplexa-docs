/**
 * Register User Use Case
 *
 * Handles user registration business logic:
 * - Validates email uniqueness
 * - Hashes password
 * - Creates user via repository
 * - Generates JWT tokens
 * - Creates initial session
 */

import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface.js';
import type { ISessionRepository } from '../../repositories/interfaces/session.repository.interface.js';
import { User } from '../../domain/entities/User';
import { Session } from '../../domain/entities/Session';
import { ValidationError } from '../../domain/errors/ValidationError';
import { JWTService, PasswordService } from '@anplexa/services';
import type { TokenPair } from '@anplexa/services';

export interface RegisterUserInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface RegisterUserOutput {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    isAdmin: boolean;
    credits: number;
    createdAt: string;
  };
  tokens: TokenPair;
}

/**
 * Register User Use Case
 *
 * Orchestrates user registration process including validation,
 * user creation, and authentication token generation.
 */
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly jwtService: JWTService,
    private readonly passwordService: PasswordService
  ) {}

  /**
   * Execute the registration use case
   * @param input - Registration input data
   * @returns User data and authentication tokens
   * @throws ValidationError if email already exists or password is invalid
   */
  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    // 1. Validate input
    await this.validateInput(input);

    // 2. Check email uniqueness
    const existingUser = await this.userRepository.getByEmail(input.email);
    if (existingUser) {
      throw new ValidationError('Email already registered', 'email');
    }

    // 3. Hash password
    const passwordHash = await this.passwordService.hashPassword(input.password);

    // 4. Prepare user data
    const userId = this.jwtService.generateId();
    const userData = {
      id: userId,
      email: input.email.toLowerCase().trim(),
      passwordHash,
      displayName: input.displayName?.trim() || null,
      credits: 5, // Default free credits
    };

    // 5. Create user in database
    const savedUser = await this.userRepository.create(userData);

    // 6. Generate JWT tokens
    const tokens = this.jwtService.generateTokenPair(
      savedUser.id,
      savedUser.email,
      savedUser.isAdmin
    );

    // 7. Create session with rollback on failure
    // If session creation fails after user was created, we need to rollback
    // the user creation to maintain data consistency
    try {
      const expiresAt = this.jwtService.getRefreshExpiryDate();
      await this.sessionRepository.create({
        userId: savedUser.id,
        refreshToken: tokens.refreshToken,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (sessionError) {
      // Rollback: delete the created user since session creation failed
      try {
        await this.userRepository.delete(savedUser.id);
      } catch (rollbackError) {
        // Log rollback failure but throw the original session error
        // In production, this would be logged to monitoring
        console.error('Failed to rollback user creation:', rollbackError);
      }
      throw sessionError;
    }

    // 8. Return user data and tokens
    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        displayName: savedUser.displayName,
        isAdmin: savedUser.isAdmin,
        credits: savedUser.credits,
        createdAt: savedUser.createdAt,
      },
      tokens,
    };
  }

  /**
   * Validate registration input
   * @param input - Registration input data
   * @throws ValidationError if validation fails
   */
  private async validateInput(input: RegisterUserInput): Promise<void> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!input.email || !emailRegex.test(input.email)) {
      throw new ValidationError('Invalid email format', 'email');
    }

    // Validate password strength
    if (!input.password) {
      throw new ValidationError('Password is required', 'password');
    }

    const passwordValidation = this.passwordService.validatePasswordStrength(
      input.password
    );

    if (!passwordValidation.valid) {
      throw new ValidationError(
        passwordValidation.errors[0] || 'Invalid password',
        'password'
      );
    }

    // Validate display name length if provided
    if (input.displayName && input.displayName.trim().length > 255) {
      throw new ValidationError(
        'Display name must be less than 255 characters',
        'displayName'
      );
    }
  }
}
