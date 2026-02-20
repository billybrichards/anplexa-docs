/**
 * Validation Error
 *
 * Thrown when domain entity validation fails.
 */

import { DomainError } from './DomainError.js';

export class ValidationError extends DomainError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
  }
}
