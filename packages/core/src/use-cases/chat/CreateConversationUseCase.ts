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

import type { ConversationDTO } from '@anplexa/contracts';
import type { IConversationRepository } from '../../repositories/interfaces/conversation.repository.interface';
import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface';

/**
 * Input parameters for creating a conversation
 */
export interface CreateConversationInput {
  userId: string;
  title?: string | null;
}

/**
 * Output from creating a conversation
 */
export interface CreateConversationOutput {
  conversation: ConversationDTO;
}

/**
 * Custom error types for Create Conversation use case
 */
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class InvalidTitleError extends Error {
  constructor(reason: string) {
    super(`Invalid conversation title: ${reason}`);
    this.name = 'InvalidTitleError';
  }
}

/**
 * Create Conversation Use Case
 *
 * Implements the business logic for creating a new conversation.
 * Follows the Clean Architecture use case pattern with a single execute() method.
 */
export class CreateConversationUseCase {
  private static readonly MAX_TITLE_LENGTH = 500;

  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Execute the create conversation use case
   *
   * @param input - The conversation creation parameters
   * @returns Promise resolving to the created conversation
   * @throws {UserNotFoundError} If user doesn't exist
   * @throws {InvalidTitleError} If title is invalid
   */
  async execute(input: CreateConversationInput): Promise<CreateConversationOutput> {
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
      } else if (trimmedTitle.length > CreateConversationUseCase.MAX_TITLE_LENGTH) {
        throw new InvalidTitleError(
          `Title exceeds maximum length of ${CreateConversationUseCase.MAX_TITLE_LENGTH} characters`
        );
      } else {
        input.title = trimmedTitle;
      }
    }

    // Create conversation with generated ID
    const { randomUUID } = await import('crypto');
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
