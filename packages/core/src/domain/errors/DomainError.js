"use strict";
/**
 * Base Domain Error
 *
 * All domain-specific errors should extend this class.
 * Used for domain layer exceptions that have business meaning.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainError = void 0;
class DomainError extends Error {
    code;
    constructor(message, code = 'DOMAIN_ERROR') {
        super(message);
        this.code = code;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.DomainError = DomainError;
