/**
 * Login User Use Case
 *
 * Orchestrates the login flow:
 * 1. Finds user by email
 * 2. Validates password
 * 3. Creates session with refresh token
 * 4. Returns access and refresh tokens
 */

import type { IUserRepository } from '../../repositories/IUserRepository';
import type { ISessionRepository } from '../../repositories/ISessionRepository';
import { AuthenticationError } from '../../domain/errors/AuthenticationError';

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
    private readonly sessionRepository: ISessionRepository
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    // TODO: Implement login logic
    // 1. Validate input
    // 2. Find user by email
    // 3. Validate password
    // 4. Create session
    // 5. Generate tokens
    // 6. Return response
    throw new Error('LoginUser.execute() must be implemented');
  }
}
