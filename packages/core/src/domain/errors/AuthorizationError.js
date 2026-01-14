"use strict";
/**
 * Authorization Error
 *
 * Thrown when user lacks required permissions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationError = void 0;
const DomainError_1 = require("./DomainError");
class AuthorizationError extends DomainError_1.DomainError {
    constructor(message = 'Access denied') {
        super(message, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
