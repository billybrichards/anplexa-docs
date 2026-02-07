/**
 * Domain Layer Exports
 *
 * Central export point for all domain layer components:
 * - Entities: Core business objects
 * - Errors: Domain-specific exceptions
 * - Repository Interfaces: Data persistence contracts
 */

// Entities
export { User } from './entities/User.js';
export { Conversation } from './entities/Conversation.js';
export { Message, type MessageRole } from './entities/Message.js';
export { Session } from './entities/Session.js';
export * from './entities/index.js';

// Errors
export { DomainError } from './errors/DomainError.js';
export { ValidationError } from './errors/ValidationError.js';
export { AuthenticationError } from './errors/AuthenticationError.js';
export { AuthorizationError } from './errors/AuthorizationError.js';
export { NotFoundError } from './errors/NotFoundError.js';
export * from './errors/index.js';
