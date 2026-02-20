/**
 * Base Domain Error
 *
 * All domain-specific errors should extend this class.
 * Used for domain layer exceptions that have business meaning.
 */

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'DOMAIN_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
