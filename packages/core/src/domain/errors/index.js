"use strict";
/**
 * Domain Error Exports
 *
 * Central export point for all domain errors.
 * Domain errors represent business logic failures with semantic meaning.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.DomainError = void 0;
var DomainError_1 = require("./DomainError");
Object.defineProperty(exports, "DomainError", { enumerable: true, get: function () { return DomainError_1.DomainError; } });
var ValidationError_1 = require("./ValidationError");
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return ValidationError_1.ValidationError; } });
var AuthenticationError_1 = require("./AuthenticationError");
Object.defineProperty(exports, "AuthenticationError", { enumerable: true, get: function () { return AuthenticationError_1.AuthenticationError; } });
var AuthorizationError_1 = require("./AuthorizationError");
Object.defineProperty(exports, "AuthorizationError", { enumerable: true, get: function () { return AuthorizationError_1.AuthorizationError; } });
var NotFoundError_1 = require("./NotFoundError");
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return NotFoundError_1.NotFoundError; } });
