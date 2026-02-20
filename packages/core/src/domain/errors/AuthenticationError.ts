/**
 * Authentication Error
 *
 * Thrown when user authentication fails.
 */

import { DomainError } from './DomainError.js';

export class AuthenticationError extends DomainError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR');
  }
}
