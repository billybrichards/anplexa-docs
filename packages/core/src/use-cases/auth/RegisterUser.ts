/**
 * Register User Use Case
 *
 * Orchestrates the user registration flow:
 * 1. Validates input
 * 2. Checks if email already exists
 * 3. Creates new user entity
 * 4. Persists user
 * 5. Returns user data
 */

import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface.js';
import { ValidationError } from '../../domain/errors/ValidationError';

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
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // TODO: Implement register logic
    // 1. Validate input
    // 2. Check if email exists
    // 3. Hash password
    // 4. Create user entity
    // 5. Persist user
    // 6. Return response
    throw new Error('RegisterUser.execute() must be implemented');
  }
}
