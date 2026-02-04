/**
 * Send Message Use Case
 *
 * Orchestrates the message sending and AI response flow:
 * 1. Validates user has sufficient credits
 * 2. Saves user message to conversation
 * 3. Calls AI service to generate response
 * 4. Streams AI response back to user
 * 5. Saves AI message to conversation
 * 6. Deducts credits from user
 */

import type { IConversationRepository } from '../../repositories/interfaces/conversation.repository.interface';
import type { IMessageRepository } from '../../repositories/interfaces/message.repository.interface';
import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface';

export interface SendMessageRequest {
  conversationId: string;
  userId: string;
  content: string;
}

export interface SendMessageResponse {
  messageId: string;
  conversationId: string;
}

export class SendMessage {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly messageRepository: IMessageRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: SendMessageRequest): Promise<SendMessageResponse> {
    // TODO: Implement send message logic
    // 1. Validate user exists
    // 2. Check user has sufficient credits
    // 3. Validate conversation exists
    // 4. Save user message
    // 5. Call AI provider (via infrastructure)
    // 6. Stream response
    // 7. Save AI message
    // 8. Deduct credits
    // 9. Return response
    throw new Error('SendMessage.execute() must be implemented');
  }
}
