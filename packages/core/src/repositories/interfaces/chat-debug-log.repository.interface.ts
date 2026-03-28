/**
 * Chat Debug Log Repository Interface
 *
 * Data access contract for chat pipeline debug logging.
 */

export interface ChatDebugLogRecord {
  id: string;
  category: string;
  event: string;
  conversationId: string | null;
  message: string | null;
  metadata: string | null;
  createdAt: string | null;
}

export interface CreateChatDebugLogData {
  id: string;
  category: string;
  event: string;
  conversationId?: string;
  message?: string;
  metadata?: string;
}

export interface IChatDebugLogRepository {
  insert(data: CreateChatDebugLogData): Promise<ChatDebugLogRecord>;
  findByConversation(conversationId: string): Promise<ChatDebugLogRecord[]>;
}
