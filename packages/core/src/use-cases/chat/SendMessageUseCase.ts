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

import type { MessageDTO, MessageRole } from '@anplexa/contracts';
import type { IConversationRepository } from '../../repositories/interfaces/conversation.repository.interface';
import type { IMessageRepository } from '../../repositories/interfaces/message.repository.interface';
import type { OllamaGateway, ChatMessage } from '@anplexa/services/ai';

/**
 * Input parameters for sending a message
 */
export interface SendMessageInput {
  conversationId: string;
  userId: string;
  content: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Output from sending a message
 */
export interface SendMessageOutput {
  userMessage: MessageDTO;
  assistantMessage: MessageDTO;
  conversationId: string;
}

/**
 * Custom error types for Send Message use case
 */
export class ConversationNotFoundError extends Error {
  constructor(conversationId: string) {
    super(`Conversation not found: ${conversationId}`);
    this.name = 'ConversationNotFoundError';
  }
}

export class UnauthorizedConversationAccessError extends Error {
  constructor(conversationId: string, userId: string) {
    super(`User ${userId} is not authorized to access conversation ${conversationId}`);
    this.name = 'UnauthorizedConversationAccessError';
  }
}

export class EmptyMessageError extends Error {
  constructor() {
    super('Message content cannot be empty');
    this.name = 'EmptyMessageError';
  }
}

export class AIServiceError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(`AI service error: ${message}`);
    this.name = 'AIServiceError';
  }
}

/**
 * Send Message Use Case
 *
 * Implements the business logic for processing a user message and generating an AI response.
 * Follows the Clean Architecture use case pattern with a single execute() method.
 */
export class SendMessageUseCase {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly messageRepository: IMessageRepository,
    private readonly ollamaGateway: OllamaGateway
  ) {}

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
  async execute(input: SendMessageInput): Promise<SendMessageOutput> {
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
      role: 'user' as MessageRole,
      content: input.content.trim(),
    });

    // Get conversation history for context
    const previousMessages = await this.messageRepository.getByConversationId(
      input.conversationId,
      { limit: 10 } // Get last 10 messages for context
    );

    // Build chat messages for AI (excluding the message we just created since it will be added)
    const chatMessages: ChatMessage[] = previousMessages
      .filter(msg => msg.id !== userMessage.id) // Exclude the just-created message
      .map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      }));

    // Add the current user message
    chatMessages.push({
      role: 'user',
      content: input.content.trim(),
    });

    // Call AI service to generate response
    let aiResponse: string;
    try {
      const model = input.model || 'darkplanet-general:latest';
      aiResponse = await this.ollamaGateway.generate({
        model,
        messages: chatMessages,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      });
    } catch (error) {
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        error
      );
    }

    // Validate AI response
    if (!aiResponse || aiResponse.trim().length === 0) {
      throw new AIServiceError('AI service returned empty response');
    }

    // Create assistant message
    const assistantMessage = await this.messageRepository.create({
      conversationId: input.conversationId,
      role: 'assistant' as MessageRole,
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
