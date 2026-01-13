/**
 * Domain Layer Exports
 *
 * Central export point for all domain layer components:
 * - Entities: Core business objects
 * - Errors: Domain-specific exceptions
 * - Repository Interfaces: Data persistence contracts
 */

// Entities
export { User } from './entities/User';
export { Conversation } from './entities/Conversation';
export { Message, type MessageRole } from './entities/Message';
export { Session } from './entities/Session';
export * from './entities/index';

// Errors
export { DomainError } from './errors/DomainError';
export { ValidationError } from './errors/ValidationError';
export { AuthenticationError } from './errors/AuthenticationError';
export { AuthorizationError } from './errors/AuthorizationError';
export { NotFoundError } from './errors/NotFoundError';
export * from './errors/index';
