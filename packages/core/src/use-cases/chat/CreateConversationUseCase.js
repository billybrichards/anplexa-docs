"use strict";
/**
 * Create Conversation Use Case
 *
 * Handles the business logic for creating a new conversation.
 * This use case orchestrates:
 * 1. Validating the user exists
 * 2. Creating a conversation with optional title
 * 3. Setting initial metadata
 * 4. Returning the created conversation
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateConversationUseCase = exports.InvalidTitleError = exports.UserNotFoundError = void 0;
/**
 * Custom error types for Create Conversation use case
 */
class UserNotFoundError extends Error {
    constructor(userId) {
        super(`User not found: ${userId}`);
        this.name = 'UserNotFoundError';
    }
}
exports.UserNotFoundError = UserNotFoundError;
class InvalidTitleError extends Error {
    constructor(reason) {
        super(`Invalid conversation title: ${reason}`);
        this.name = 'InvalidTitleError';
    }
}
exports.InvalidTitleError = InvalidTitleError;
/**
 * Create Conversation Use Case
 *
 * Implements the business logic for creating a new conversation.
 * Follows the Clean Architecture use case pattern with a single execute() method.
 */
class CreateConversationUseCase {
    conversationRepository;
    userRepository;
    static MAX_TITLE_LENGTH = 500;
    constructor(conversationRepository, userRepository) {
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
    }
    /**
     * Execute the create conversation use case
     *
     * @param input - The conversation creation parameters
     * @returns Promise resolving to the created conversation
     * @throws {UserNotFoundError} If user doesn't exist
     * @throws {InvalidTitleError} If title is invalid
     */
    async execute(input) {
        // Validate user exists
        const user = await this.userRepository.getById(input.userId);
        if (!user) {
            throw new UserNotFoundError(input.userId);
        }
        // Validate title if provided
        if (input.title !== undefined && input.title !== null) {
            const trimmedTitle = input.title.trim();
            // Title can be empty string (treated as null)
            if (trimmedTitle.length === 0) {
                input.title = null;
            }
            else if (trimmedTitle.length > CreateConversationUseCase.MAX_TITLE_LENGTH) {
                throw new InvalidTitleError(`Title exceeds maximum length of ${CreateConversationUseCase.MAX_TITLE_LENGTH} characters`);
            }
            else {
                input.title = trimmedTitle;
            }
        }
        // Create conversation with generated ID
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require('crypto')));
        const conversation = await this.conversationRepository.create({
            id: randomUUID(),
            userId: input.userId,
            title: input.title,
        });
        return {
            conversation,
        };
    }
}
exports.CreateConversationUseCase = CreateConversationUseCase;
