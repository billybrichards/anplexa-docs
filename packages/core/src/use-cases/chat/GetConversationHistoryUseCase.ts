/**
 * Get Conversation History Use Case
 *
 * Handles the business logic for retrieving a conversation with its message history.
 * This use case orchestrates:
 * 1. Fetching the conversation by ID
 * 2. Validating user has access to the conversation
 * 3. Fetching messages with pagination support
 * 4. Returning conversation with messages
 */

import type { ConversationDTO, MessageDTO } from '@anplexa/contracts';
import type { IConversationRepository } from '../../repositories/interfaces/conversation.repository.interface';
import type { IMessageRepository, PaginationOptions } from '../../repositories/interfaces/message.repository.interface';

/**
 * Input parameters for getting conversation history
 */
export interface GetConversationHistoryInput {
  conversationId: string;
  userId: string;
  limit?: number;
  offset?: number;
}

/**
 * Output from getting conversation history
 */
export interface GetConversationHistoryOutput {
  conversation: ConversationDTO;
  messages: MessageDTO[];
  totalMessages: number;
  hasMore: boolean;
}

/**
 * Custom error types for Get Conversation History use case
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

export class InvalidPaginationError extends Error {
  constructor(reason: string) {
    super(`Invalid pagination parameters: ${reason}`);
    this.name = 'InvalidPaginationError';
  }
}

/**
 * Get Conversation History Use Case
 *
 * Implements the business logic for retrieving conversation history.
 * Follows the Clean Architecture use case pattern with a single execute() method.
 */
export class GetConversationHistoryUseCase {
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly MAX_LIMIT = 500;
  private static readonly DEFAULT_OFFSET = 0;

  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly messageRepository: IMessageRepository
  ) {}

  /**
   * Execute the get conversation history use case
   *
   * @param input - The conversation history query parameters
   * @returns Promise resolving to conversation with messages
   * @throws {ConversationNotFoundError} If conversation doesn't exist
   * @throws {UnauthorizedConversationAccessError} If user doesn't own conversation
   * @throws {InvalidPaginationError} If pagination parameters are invalid
   */
  async execute(input: GetConversationHistoryInput): Promise<GetConversationHistoryOutput> {
    // Validate pagination parameters
    const limit = this.validateLimit(input.limit);
    const offset = this.validateOffset(input.offset);

    // Fetch conversation
    const conversation = await this.conversationRepository.getById(input.conversationId);

    if (!conversation) {
      throw new ConversationNotFoundError(input.conversationId);
    }

    // Verify user has access to this conversation
    if (conversation.userId !== input.userId) {
      throw new UnauthorizedConversationAccessError(input.conversationId, input.userId);
    }

    // Build pagination options
    const paginationOptions: PaginationOptions = {
      limit: limit + 1, // Fetch one extra to determine if there are more
      offset,
    };

    // Fetch messages
    const messages = await this.messageRepository.getByConversationId(
      input.conversationId,
      paginationOptions
    );

    // Determine if there are more messages
    const hasMore = messages.length > limit;

    // Remove the extra message if present
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    // Calculate total messages (approximation based on current fetch)
    // In a real system, you might want to add a count method to the repository
    const totalMessages = offset + resultMessages.length + (hasMore ? 1 : 0);

    return {
      conversation,
      messages: resultMessages,
      totalMessages,
      hasMore,
    };
  }

  /**
   * Validate and normalize the limit parameter
   */
  private validateLimit(limit?: number): number {
    if (limit === undefined || limit === null) {
      return GetConversationHistoryUseCase.DEFAULT_LIMIT;
    }

    if (!Number.isInteger(limit) || limit < 1) {
      throw new InvalidPaginationError('Limit must be a positive integer');
    }

    if (limit > GetConversationHistoryUseCase.MAX_LIMIT) {
      throw new InvalidPaginationError(
        `Limit cannot exceed ${GetConversationHistoryUseCase.MAX_LIMIT}`
      );
    }

    return limit;
  }

  /**
   * Validate and normalize the offset parameter
   */
  private validateOffset(offset?: number): number {
    if (offset === undefined || offset === null) {
      return GetConversationHistoryUseCase.DEFAULT_OFFSET;
    }

    if (!Number.isInteger(offset) || offset < 0) {
      throw new InvalidPaginationError('Offset must be a non-negative integer');
    }

    return offset;
  }
}
