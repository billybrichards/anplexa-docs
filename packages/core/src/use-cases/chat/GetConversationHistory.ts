/**
 * Get Conversation History Use Case
 *
 * ⚠️ STUB — Not yet implemented. History retrieval is currently handled by:
 * - GET /api/chat/conversations/:id/messages (fetches from Letta or local messages table)
 * - GET /api/chat/history/:companionId (fetches by companion persona from Letta or chat_messages)
 * See apps/api/src/routes/chat/conversations.ts for the working implementation.
 *
 * Original design:
 * 1. Validates conversation exists
 * 2. Validates user owns the conversation
 * 3. Fetches messages with pagination
 * 4. Returns formatted messages
 */

import type { IConversationRepository } from '../../repositories/IConversationRepository.js';
import type { IMessageRepository } from '../../repositories/IMessageRepository.js';
import { NotFoundError } from '../../domain/errors/NotFoundError.js';
import { AuthorizationError } from '../../domain/errors/AuthorizationError.js';

export interface GetConversationHistoryRequest {
  conversationId: string;
  userId: string;
  limit?: number;
  offset?: number;
}

export interface GetConversationHistoryResponse {
  conversationId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
  }>;
  total: number;
}

export class GetConversationHistory {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly messageRepository: IMessageRepository
  ) {}

  async execute(
    request: GetConversationHistoryRequest
  ): Promise<GetConversationHistoryResponse> {
    // TODO: Implement get conversation history logic
    // 1. Find conversation
    // 2. Verify user owns conversation
    // 3. Fetch messages with pagination
    // 4. Return formatted response
    throw new Error('GetConversationHistory.execute() must be implemented');
  }
}
