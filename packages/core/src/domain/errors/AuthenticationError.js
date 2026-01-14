"use strict";
/**
 * Authentication Error
 *
 * Thrown when user authentication fails.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationError = void 0;
const DomainError_1 = require("./DomainError");
class AuthenticationError extends DomainError_1.DomainError {
    constructor(message = 'Authentication failed') {
        super(message, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
