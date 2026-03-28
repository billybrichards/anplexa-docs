/**
 * Chat Debug Log Repository Implementation
 *
 * Drizzle ORM implementation for chat_debug_logs table.
 */

import type { Database } from '@anplexa/database';
import { chatDebugLogs, eq, desc } from '@anplexa/database';
import type {
  IChatDebugLogRepository,
  ChatDebugLogRecord,
  CreateChatDebugLogData,
} from './interfaces/chat-debug-log.repository.interface.js';

export class ChatDebugLogRepository implements IChatDebugLogRepository {
  constructor(private readonly db: Database) {}

  async insert(data: CreateChatDebugLogData): Promise<ChatDebugLogRecord> {
    const [result] = await this.db
      .insert(chatDebugLogs)
      .values({
        ...data,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return result;
  }

  async findByConversation(conversationId: string): Promise<ChatDebugLogRecord[]> {
    return this.db
      .select()
      .from(chatDebugLogs)
      .where(eq(chatDebugLogs.conversationId, conversationId))
      .orderBy(desc(chatDebugLogs.createdAt));
  }
}
