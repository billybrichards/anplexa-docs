/**
 * Send Message Use Case
 *
 * ⚠️ DEAD CODE — Chat messaging now goes through Letta agents directly via
 * the /api/chat/send SSE endpoint (apps/api/src/routes/chat/send.ts).
 * This use case is retained for reference but is never called in production.
 *
 * Original design:
 * 1. Validates user has sufficient credits
 * 2. Saves user message to conversation
 * 3. Calls AI service to generate response
 * 4. Streams AI response back to user
 * 5. Saves AI message to conversation
 * 6. Deducts credits from user
 */

import type { IConversationRepository } from '../../repositories/interfaces/conversation.repository.interface.js';
import type { IMessageRepository } from '../../repositories/interfaces/message.repository.interface.js';
import type { IUserRepository } from '../../repositories/interfaces/user.repository.interface.js';

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
    // DEAD CODE — Chat goes through Letta agents directly (see routes/chat/send.ts).
    // This use case is not wired up and should not be called.
    // Kept for reference in case the architecture reverts to a non-Letta chat path.
    throw new Error('SendMessage is dead code — chat goes through Letta agents directly. See routes/chat/send.ts');
  }
}
