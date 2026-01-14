"use strict";
/**
 * Send Message Use Case
 *
 * Handles the business logic for sending a message in a conversation and generating an AI response.
 * This use case orchestrates:
 * 1. Validating the conversation exists
 * 2. Creating the user message
 * 3. Calling the AI service for a response
 * 4. Creating the AI response message
 * 5. Returning both messages
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendMessageUseCase = exports.AIServiceError = exports.EmptyMessageError = exports.UnauthorizedConversationAccessError = exports.ConversationNotFoundError = void 0;
/**
 * Custom error types for Send Message use case
 */
class ConversationNotFoundError extends Error {
    constructor(conversationId) {
        super(`Conversation not found: ${conversationId}`);
        this.name = 'ConversationNotFoundError';
    }
}
exports.ConversationNotFoundError = ConversationNotFoundError;
class UnauthorizedConversationAccessError extends Error {
    constructor(conversationId, userId) {
        super(`User ${userId} is not authorized to access conversation ${conversationId}`);
        this.name = 'UnauthorizedConversationAccessError';
    }
}
exports.UnauthorizedConversationAccessError = UnauthorizedConversationAccessError;
class EmptyMessageError extends Error {
    constructor() {
        super('Message content cannot be empty');
        this.name = 'EmptyMessageError';
    }
}
exports.EmptyMessageError = EmptyMessageError;
class AIServiceError extends Error {
    originalError;
    constructor(message, originalError) {
        super(`AI service error: ${message}`);
        this.originalError = originalError;
        this.name = 'AIServiceError';
    }
}
exports.AIServiceError = AIServiceError;
/**
 * Send Message Use Case
 *
 * Implements the business logic for processing a user message and generating an AI response.
 * Follows the Clean Architecture use case pattern with a single execute() method.
 */
class SendMessageUseCase {
    conversationRepository;
    messageRepository;
    ollamaGateway;
    constructor(conversationRepository, messageRepository, ollamaGateway) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.ollamaGateway = ollamaGateway;
    }
    /**
     * Execute the send message use case
     *
     * @param input - The message input parameters
     * @returns Promise resolving to both user and assistant messages
     * @throws {EmptyMessageError} If message content is empty
     * @throws {ConversationNotFoundError} If conversation doesn't exist
     * @throws {UnauthorizedConversationAccessError} If user doesn't own conversation
     * @throws {AIServiceError} If AI service fails
     */
    async execute(input) {
        // Validate input
        if (!input.content || input.content.trim().length === 0) {
            throw new EmptyMessageError();
        }
        // Verify conversation exists and user has access
        const conversation = await this.conversationRepository.getById(input.conversationId);
        if (!conversation) {
            throw new ConversationNotFoundError(input.conversationId);
        }
        if (conversation.userId !== input.userId) {
            throw new UnauthorizedConversationAccessError(input.conversationId, input.userId);
        }
        // Create user message
        const userMessage = await this.messageRepository.create({
            conversationId: input.conversationId,
            role: 'user',
            content: input.content.trim(),
        });
        // Get conversation history for context
        const previousMessages = await this.messageRepository.getByConversationId(input.conversationId, { limit: 10 } // Get last 10 messages for context
        );
        // Build chat messages for AI (excluding the message we just created since it will be added)
        const chatMessages = previousMessages
            .filter(msg => msg.id !== userMessage.id) // Exclude the just-created message
            .map(msg => ({
            role: msg.role,
            content: msg.content,
        }));
        // Add the current user message
        chatMessages.push({
            role: 'user',
            content: input.content.trim(),
        });
        // Call AI service to generate response
        let aiResponse;
        try {
            const model = input.model || 'darkplanet-general:latest';
            aiResponse = await this.ollamaGateway.generate({
                model,
                messages: chatMessages,
                temperature: input.temperature,
                maxTokens: input.maxTokens,
            });
        }
        catch (error) {
            throw new AIServiceError(error instanceof Error ? error.message : 'Unknown error occurred', error);
        }
        // Validate AI response
        if (!aiResponse || aiResponse.trim().length === 0) {
            throw new AIServiceError('AI service returned empty response');
        }
        // Create assistant message
        const assistantMessage = await this.messageRepository.create({
            conversationId: input.conversationId,
            role: 'assistant',
            content: aiResponse.trim(),
        });
        // Update conversation's updatedAt timestamp
        await this.conversationRepository.update(input.conversationId, {
            updatedAt: new Date().toISOString(),
        });
        return {
            userMessage,
            assistantMessage,
            conversationId: input.conversationId,
        };
    }
}
exports.SendMessageUseCase = SendMessageUseCase;
