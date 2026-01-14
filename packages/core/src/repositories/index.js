"use strict";
/**
 * Repository Layer Exports
 *
 * Central export point for all repository implementations and interfaces.
 *
 * This includes:
 * - Repository interfaces (data persistence contracts)
 * - Repository implementations (in-memory/database implementations)
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
exports.SessionRepository = exports.MessageRepository = exports.ConversationRepository = exports.UserRepository = void 0;
// ============================================================================
// Repository Interfaces
// ============================================================================
__exportStar(require("./interfaces/index.js"), exports);
// ============================================================================
// Repository Implementations
// ============================================================================
var user_repository_js_1 = require("./user.repository.js");
Object.defineProperty(exports, "UserRepository", { enumerable: true, get: function () { return user_repository_js_1.UserRepository; } });
var conversation_repository_js_1 = require("./conversation.repository.js");
Object.defineProperty(exports, "ConversationRepository", { enumerable: true, get: function () { return conversation_repository_js_1.ConversationRepository; } });
var message_repository_js_1 = require("./message.repository.js");
Object.defineProperty(exports, "MessageRepository", { enumerable: true, get: function () { return message_repository_js_1.MessageRepository; } });
var session_repository_js_1 = require("./session.repository.js");
Object.defineProperty(exports, "SessionRepository", { enumerable: true, get: function () { return session_repository_js_1.SessionRepository; } });
