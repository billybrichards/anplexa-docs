/**
 * Authorization Error
 *
 * Thrown when user lacks required permissions.
 */

import { DomainError } from './DomainError.js';

export class AuthorizationError extends DomainError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR');
  }
}
