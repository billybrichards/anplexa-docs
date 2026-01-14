"use strict";
/**
 * Validation Error
 *
 * Thrown when domain entity validation fails.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
const DomainError_1 = require("./DomainError");
class ValidationError extends DomainError_1.DomainError {
    field;
    constructor(message, field) {
        super(message, 'VALIDATION_ERROR');
        this.field = field;
    }
}
exports.ValidationError = ValidationError;
