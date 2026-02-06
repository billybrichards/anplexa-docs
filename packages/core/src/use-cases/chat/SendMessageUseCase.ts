/**
 * Send Message Use Case
 *
 * Handles the business logic for sending a message in a conversation and generating an AI response.
 * This use case orchestrates:
 * 1. Validating the conversation exists
 * 2. Fetching the user's active companion persona (if available)
 * 3. Building the system prompt with persona customization
 * 4. Creating the user message
 * 5. Calling the AI service for a response
 * 6. Creating the AI response message
 * 7. Returning both messages
 */

import type { MessageDTO, MessageRole } from '@anplexa/contracts';
import type { IConversationRepository } from '../../repositories/interfaces/conversation.repository.interface';
import type { IMessageRepository } from '../../repositories/interfaces/message.repository.interface';
import type { ICompanionPersonaRepository } from '../../repositories/interfaces/companion-persona.repository.interface';
import type { IChatGateway, ChatMessage } from '../../domain/services/IChatGateway';
import {
  SystemPromptBuilder,
  type SystemPromptConfig,
  type ConversationContext,
} from '../../domain/services/SystemPromptBuilder';

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
 *
 * Supports personalized AI responses through CompanionPersona system prompts.
 */
export class SendMessageUseCase {
  private readonly systemPromptBuilder: SystemPromptBuilder;

  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly messageRepository: IMessageRepository,
    private readonly ollamaGateway: IChatGateway,
    private readonly companionPersonaRepository?: ICompanionPersonaRepository,
    systemPromptConfig?: SystemPromptConfig
  ) {
    this.systemPromptBuilder = new SystemPromptBuilder(systemPromptConfig);
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

    // Fetch user's active companion persona (if repository is available)
    const persona = this.companionPersonaRepository
      ? await this.companionPersonaRepository.getActiveByUserId(input.userId)
      : null;

    // Build system prompt with persona customization
    const conversationContext: ConversationContext = {
      currentDateTime: new Date(),
    };
    const systemPrompt = this.systemPromptBuilder.build(persona, conversationContext);

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

    // Build chat messages for AI
    // Start with system prompt, then conversation history, then current message
    const chatMessages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add conversation history (excluding the message we just created and any existing system messages)
    const historyMessages = previousMessages
      .filter(msg => msg.id !== userMessage.id && msg.role !== 'system')
      .map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      }));
    chatMessages.push(...historyMessages);

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
