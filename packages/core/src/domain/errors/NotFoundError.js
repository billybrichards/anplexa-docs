"use strict";
/**
 * Not Found Error
 *
 * Thrown when a requested entity is not found.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
const DomainError_1 = require("./DomainError");
class NotFoundError extends DomainError_1.DomainError {
    constructor(entityName, id) {
        const message = id
            ? `${entityName} with id ${id} not found`
            : `${entityName} not found`;
        super(message, 'NOT_FOUND_ERROR');
    }
}
exports.NotFoundError = NotFoundError;
