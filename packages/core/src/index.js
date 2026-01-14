"use strict";
/**
 * @anplexa/core - Clean Architecture Implementation
 *
 * Anplexa's domain layer, business logic, and data persistence contracts.
 *
 * This package follows Clean Architecture principles with four distinct layers:
 * - Domain: Entities and errors (zero external dependencies)
 * - Application: Use cases orchestrating business logic
 * - Interface Adapters: Repository interfaces defining contracts
 * - Infrastructure: Implementations (external to this package)
 *
 * All exports are fully typed with TypeScript. No `any` types in public API.
 *
 * @example
 * ```typescript
 * // Import domain entities
 * import { User, Conversation } from '@anplexa/core';
 *
 * // Import use cases
 * import { LoginUser, SendMessageUseCase } from '@anplexa/core';
 *
 * // Import repository interfaces
 * import type { IUserRepository } from '@anplexa/core';
 *
 * // Import factories
 * import { createLoginUserUseCase } from '@anplexa/core';
 * ```
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRepository = exports.MessageRepository = exports.ConversationRepository = exports.UserRepository = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.DomainError = exports.Session = exports.Message = exports.Conversation = exports.User = void 0;
// ============================================================================
// Domain Layer Exports
// ============================================================================
// Domain entities
var index_js_1 = require("./domain/entities/index.js");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return index_js_1.User; } });
Object.defineProperty(exports, "Conversation", { enumerable: true, get: function () { return index_js_1.Conversation; } });
Object.defineProperty(exports, "Message", { enumerable: true, get: function () { return index_js_1.Message; } });
Object.defineProperty(exports, "Session", { enumerable: true, get: function () { return index_js_1.Session; } });
// Domain errors
var index_js_2 = require("./domain/errors/index.js");
Object.defineProperty(exports, "DomainError", { enumerable: true, get: function () { return index_js_2.DomainError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return index_js_2.ValidationError; } });
Object.defineProperty(exports, "AuthenticationError", { enumerable: true, get: function () { return index_js_2.AuthenticationError; } });
Object.defineProperty(exports, "AuthorizationError", { enumerable: true, get: function () { return index_js_2.AuthorizationError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return index_js_2.NotFoundError; } });
// ============================================================================
// Repository Layer Exports
// ============================================================================
// Repository interfaces (data persistence contracts)
__exportStar(require("./repositories/interfaces/index.js"), exports);
// Repository implementations (for testing and in-memory usage)
var index_js_3 = require("./repositories/index.js");
Object.defineProperty(exports, "UserRepository", { enumerable: true, get: function () { return index_js_3.UserRepository; } });
Object.defineProperty(exports, "ConversationRepository", { enumerable: true, get: function () { return index_js_3.ConversationRepository; } });
Object.defineProperty(exports, "MessageRepository", { enumerable: true, get: function () { return index_js_3.MessageRepository; } });
Object.defineProperty(exports, "SessionRepository", { enumerable: true, get: function () { return index_js_3.SessionRepository; } });
// ============================================================================
// Application Layer Exports (Use Cases)
// ============================================================================
// Auth use cases
__exportStar(require("./use-cases/auth/index.js"), exports);
// Chat use cases
__exportStar(require("./use-cases/chat/index.js"), exports);
// Subscription use cases
__exportStar(require("./use-cases/subscription/index.js"), exports);
// ============================================================================
// Dependency Injection & Factory Functions
// ============================================================================
__exportStar(require("./factories.js"), exports);
