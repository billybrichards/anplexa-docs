"use strict";
/**
 * Chat Use Cases
 *
 * Exports all chat-related use cases for clean architecture implementation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidPaginationError = exports.GetHistoryUnauthorizedAccessError = exports.GetHistoryConversationNotFoundError = exports.GetConversationHistoryUseCase = exports.InvalidTitleError = exports.UserNotFoundError = exports.CreateConversationUseCase = exports.AIServiceError = exports.EmptyMessageError = exports.SendMessageUnauthorizedAccessError = exports.SendMessageConversationNotFoundError = exports.SendMessageUseCase = void 0;
// Send Message Use Case
var SendMessageUseCase_1 = require("./SendMessageUseCase");
Object.defineProperty(exports, "SendMessageUseCase", { enumerable: true, get: function () { return SendMessageUseCase_1.SendMessageUseCase; } });
Object.defineProperty(exports, "SendMessageConversationNotFoundError", { enumerable: true, get: function () { return SendMessageUseCase_1.ConversationNotFoundError; } });
Object.defineProperty(exports, "SendMessageUnauthorizedAccessError", { enumerable: true, get: function () { return SendMessageUseCase_1.UnauthorizedConversationAccessError; } });
Object.defineProperty(exports, "EmptyMessageError", { enumerable: true, get: function () { return SendMessageUseCase_1.EmptyMessageError; } });
Object.defineProperty(exports, "AIServiceError", { enumerable: true, get: function () { return SendMessageUseCase_1.AIServiceError; } });
// Create Conversation Use Case
var CreateConversationUseCase_1 = require("./CreateConversationUseCase");
Object.defineProperty(exports, "CreateConversationUseCase", { enumerable: true, get: function () { return CreateConversationUseCase_1.CreateConversationUseCase; } });
Object.defineProperty(exports, "UserNotFoundError", { enumerable: true, get: function () { return CreateConversationUseCase_1.UserNotFoundError; } });
Object.defineProperty(exports, "InvalidTitleError", { enumerable: true, get: function () { return CreateConversationUseCase_1.InvalidTitleError; } });
// Get Conversation History Use Case
var GetConversationHistoryUseCase_1 = require("./GetConversationHistoryUseCase");
Object.defineProperty(exports, "GetConversationHistoryUseCase", { enumerable: true, get: function () { return GetConversationHistoryUseCase_1.GetConversationHistoryUseCase; } });
Object.defineProperty(exports, "GetHistoryConversationNotFoundError", { enumerable: true, get: function () { return GetConversationHistoryUseCase_1.ConversationNotFoundError; } });
Object.defineProperty(exports, "GetHistoryUnauthorizedAccessError", { enumerable: true, get: function () { return GetConversationHistoryUseCase_1.UnauthorizedConversationAccessError; } });
Object.defineProperty(exports, "InvalidPaginationError", { enumerable: true, get: function () { return GetConversationHistoryUseCase_1.InvalidPaginationError; } });
