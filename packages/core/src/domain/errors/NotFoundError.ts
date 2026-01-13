/**
 * Not Found Error
 *
 * Thrown when a requested entity is not found.
 */

import { DomainError } from './DomainError';

export class NotFoundError extends DomainError {
  constructor(entityName: string, id?: string) {
    const message = id
      ? `${entityName} with id ${id} not found`
      : `${entityName} not found`;
    super(message, 'NOT_FOUND_ERROR');
  }
}
