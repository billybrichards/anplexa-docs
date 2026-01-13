/**
 * Message Repository Tests
 *
 * Comprehensive test suite for MessageRepository implementation.
 * Uses SQLite in-memory database for testing.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { messages, conversations, users } from '@anplexa/database';
import { MessageRepository } from '../message.repository';
import type { CreateMessageData } from '../interfaces/message.repository.interface';

describe('MessageRepository', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;
  let repository: MessageRepository;
  let testUserId: string;
  let testConversationId: string;

  beforeEach(async () => {
    // Create in-memory SQLite database
    sqlite = new Database(':memory:');
    db = drizzle(sqlite);

    // Create schema
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        chat_name TEXT,
        personality_mode TEXT DEFAULT 'nurturing',
        storage_preference TEXT DEFAULT 'cloud',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_admin INTEGER DEFAULT 0,
        subscription_status TEXT DEFAULT 'not_subscribed',
        manual_subscription_override INTEGER DEFAULT 0,
        credits INTEGER DEFAULT 0,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        account_source TEXT DEFAULT 'frontend',
        last_credit_refresh TEXT,
        amplexa_funnel TEXT,
        amplexa_funnel_name TEXT,
        amplexa_responses TEXT,
        amplexa_primary_need TEXT,
        amplexa_communication_style TEXT,
        amplexa_pace TEXT,
        amplexa_tags TEXT,
        amplexa_timestamp TEXT,
        source_channel TEXT
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create test user and conversation
    testUserId = 'test-user-123';
    testConversationId = 'test-conversation-123';

    await db.insert(users).values({
      id: testUserId,
      email: 'test@example.com',
      passwordHash: 'hashed',
    });

    await db.insert(conversations).values({
      id: testConversationId,
      userId: testUserId,
      title: 'Test Conversation',
    });

    // Initialize repository
    repository = new MessageRepository(db);
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('create', () => {
    it('should create a message successfully', async () => {
      const messageData: CreateMessageData = {
        conversationId: testConversationId,
        role: 'user',
        content: 'Hello, world!',
      };

      const result = await repository.create(messageData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.conversationId).toBe(testConversationId);
      expect(result.role).toBe('user');
      expect(result.content).toBe('Hello, world!');
      expect(result.createdAt).toBeDefined();
    });

    it('should create messages with different roles', async () => {
      const roles = ['user', 'assistant', 'system'] as const;

      for (const role of roles) {
        const messageData: CreateMessageData = {
          conversationId: testConversationId,
          role,
          content: `Message from ${role}`,
        };

        const result = await repository.create(messageData);
        expect(result.role).toBe(role);
      }
    });

    it('should generate unique IDs for each message', async () => {
      const messageData: CreateMessageData = {
        conversationId: testConversationId,
        role: 'user',
        content: 'Test message',
      };

      const result1 = await repository.create(messageData);
      const result2 = await repository.create(messageData);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should handle long message content', async () => {
      const longContent = 'A'.repeat(5000);
      const messageData: CreateMessageData = {
        conversationId: testConversationId,
        role: 'user',
        content: longContent,
      };

      const result = await repository.create(messageData);
      expect(result.content).toBe(longContent);
      expect(result.content.length).toBe(5000);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple messages at once', async () => {
      const messagesData: CreateMessageData[] = [
        {
          conversationId: testConversationId,
          role: 'user',
          content: 'First message',
        },
        {
          conversationId: testConversationId,
          role: 'assistant',
          content: 'Second message',
        },
        {
          conversationId: testConversationId,
          role: 'user',
          content: 'Third message',
        },
      ];

      const results = await repository.bulkCreate(messagesData);

      expect(results).toHaveLength(3);
      expect(results[0].content).toBe('First message');
      expect(results[1].content).toBe('Second message');
      expect(results[2].content).toBe('Third message');
    });

    it('should return empty array for empty input', async () => {
      const results = await repository.bulkCreate([]);
      expect(results).toEqual([]);
    });

    it('should create large batches efficiently', async () => {
      const largeCount = 100;
      const messagesData: CreateMessageData[] = Array.from(
        { length: largeCount },
        (_, i) => ({
          conversationId: testConversationId,
          role: 'user' as const,
          content: `Message ${i + 1}`,
        })
      );

      const startTime = Date.now();
      const results = await repository.bulkCreate(messagesData);
      const endTime = Date.now();

      expect(results).toHaveLength(largeCount);
      // Bulk insert should be reasonably fast (less than 1 second for 100 messages)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should assign unique IDs to all bulk created messages', async () => {
      const messagesData: CreateMessageData[] = [
        {
          conversationId: testConversationId,
          role: 'user',
          content: 'Message 1',
        },
        {
          conversationId: testConversationId,
          role: 'user',
          content: 'Message 2',
        },
        {
          conversationId: testConversationId,
          role: 'user',
          content: 'Message 3',
        },
      ];

      const results = await repository.bulkCreate(messagesData);
      const ids = results.map((msg) => msg.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });

    it('should handle mixed message roles in bulk', async () => {
      const messagesData: CreateMessageData[] = [
        { conversationId: testConversationId, role: 'system', content: 'System' },
        { conversationId: testConversationId, role: 'user', content: 'User' },
        { conversationId: testConversationId, role: 'assistant', content: 'Assistant' },
      ];

      const results = await repository.bulkCreate(messagesData);

      expect(results[0].role).toBe('system');
      expect(results[1].role).toBe('user');
      expect(results[2].role).toBe('assistant');
    });
  });

  describe('getByConversationId', () => {
    beforeEach(async () => {
      // Create test messages
      await repository.bulkCreate([
        {
          conversationId: testConversationId,
          role: 'user',
          content: 'Message 1',
        },
        {
          conversationId: testConversationId,
          role: 'assistant',
          content: 'Message 2',
        },
        {
          conversationId: testConversationId,
          role: 'user',
          content: 'Message 3',
        },
      ]);
    });

    it('should retrieve all messages for a conversation', async () => {
      const results = await repository.getByConversationId(testConversationId);

      expect(results).toHaveLength(3);
      expect(results[0].content).toBe('Message 1');
      expect(results[1].content).toBe('Message 2');
      expect(results[2].content).toBe('Message 3');
    });

    it('should return empty array for non-existent conversation', async () => {
      const results = await repository.getByConversationId('non-existent-id');
      expect(results).toEqual([]);
    });

    it('should order messages by creation time ascending', async () => {
      const results = await repository.getByConversationId(testConversationId);

      expect(results).toHaveLength(3);
      // Messages should be in order of creation
      for (let i = 1; i < results.length; i++) {
        const prev = new Date(results[i - 1].createdAt).getTime();
        const curr = new Date(results[i].createdAt).getTime();
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });

    it('should apply limit when provided', async () => {
      const results = await repository.getByConversationId(testConversationId, {
        limit: 2,
      });

      expect(results).toHaveLength(2);
      expect(results[0].content).toBe('Message 1');
      expect(results[1].content).toBe('Message 2');
    });

    it('should apply offset when provided', async () => {
      const results = await repository.getByConversationId(testConversationId, {
        offset: 1,
      });

      expect(results).toHaveLength(2);
      expect(results[0].content).toBe('Message 2');
      expect(results[1].content).toBe('Message 3');
    });

    it('should apply both limit and offset', async () => {
      const results = await repository.getByConversationId(testConversationId, {
        limit: 1,
        offset: 1,
      });

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Message 2');
    });

    it('should handle large conversation histories', async () => {
      // Create a large conversation
      const largeMessages: CreateMessageData[] = Array.from({ length: 500 }, (_, i) => ({
        conversationId: testConversationId,
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Message ${i + 4}`,
      }));

      await repository.bulkCreate(largeMessages);

      const results = await repository.getByConversationId(testConversationId);
      expect(results.length).toBe(503); // 3 original + 500 new
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await repository.bulkCreate([
        {
          conversationId: testConversationId,
          role: 'user',
          content: 'Hello world',
        },
        {
          conversationId: testConversationId,
          role: 'assistant',
          content: 'Hi there, how can I help you?',
        },
        {
          conversationId: testConversationId,
          role: 'user',
          content: 'I need help with TypeScript',
        },
        {
          conversationId: testConversationId,
          role: 'assistant',
          content: 'Sure, TypeScript is great!',
        },
      ]);
    });

    it('should find messages containing search term', async () => {
      const results = await repository.search(testConversationId, 'TypeScript');

      expect(results).toHaveLength(2);
      expect(results[0].content).toContain('TypeScript');
      expect(results[1].content).toContain('TypeScript');
    });

    it('should be case-insensitive', async () => {
      const results = await repository.search(testConversationId, 'typescript');

      expect(results).toHaveLength(2);
    });

    it('should return empty array when no matches found', async () => {
      const results = await repository.search(testConversationId, 'nonexistent');

      expect(results).toEqual([]);
    });

    it('should search within conversation only', async () => {
      // Create another conversation with different messages
      const otherConversationId = 'other-conversation-123';
      await db.insert(conversations).values({
        id: otherConversationId,
        userId: testUserId,
        title: 'Other Conversation',
      });

      await repository.create({
        conversationId: otherConversationId,
        role: 'user',
        content: 'TypeScript in another conversation',
      });

      const results = await repository.search(testConversationId, 'TypeScript');

      // Should only find messages in the specified conversation
      expect(results).toHaveLength(2);
      expect(results.every((msg) => msg.conversationId === testConversationId)).toBe(
        true
      );
    });

    it('should handle partial word matches', async () => {
      const results = await repository.search(testConversationId, 'help');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((msg) => msg.content.includes('help'))).toBe(true);
    });

    it('should handle special characters in search term', async () => {
      await repository.create({
        conversationId: testConversationId,
        role: 'user',
        content: 'What is 2 + 2?',
      });

      const results = await repository.search(testConversationId, '2 + 2');

      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('2 + 2');
    });
  });

  describe('delete', () => {
    it('should delete a message successfully', async () => {
      const message = await repository.create({
        conversationId: testConversationId,
        role: 'user',
        content: 'To be deleted',
      });

      await repository.delete(message.id);

      const messages = await repository.getByConversationId(testConversationId);
      expect(messages.find((msg) => msg.id === message.id)).toBeUndefined();
    });

    it('should not throw when deleting non-existent message', async () => {
      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });

    it('should only delete the specified message', async () => {
      const message1 = await repository.create({
        conversationId: testConversationId,
        role: 'user',
        content: 'Message 1',
      });

      const message2 = await repository.create({
        conversationId: testConversationId,
        role: 'user',
        content: 'Message 2',
      });

      await repository.delete(message1.id);

      const messages = await repository.getByConversationId(testConversationId);
      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe(message2.id);
    });
  });

  describe('error handling', () => {
    it('should throw meaningful error when database operation fails', async () => {
      // Close the database to force an error
      sqlite.close();

      await expect(
        repository.create({
          conversationId: testConversationId,
          role: 'user',
          content: 'Test',
        })
      ).rejects.toThrow(/Failed to create message/);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete chat conversation flow', async () => {
      // User sends message
      const userMessage = await repository.create({
        conversationId: testConversationId,
        role: 'user',
        content: 'How are you?',
      });

      // Assistant responds
      const assistantMessage = await repository.create({
        conversationId: testConversationId,
        role: 'assistant',
        content: "I'm doing well, thank you!",
      });

      // Retrieve conversation
      const conversation = await repository.getByConversationId(testConversationId);

      expect(conversation).toHaveLength(2);
      expect(conversation[0].id).toBe(userMessage.id);
      expect(conversation[1].id).toBe(assistantMessage.id);
    });

    it('should handle message history with pagination', async () => {
      // Create 20 messages
      const messages: CreateMessageData[] = Array.from({ length: 20 }, (_, i) => ({
        conversationId: testConversationId,
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Message ${i + 1}`,
      }));

      await repository.bulkCreate(messages);

      // Get first page (10 messages)
      const page1 = await repository.getByConversationId(testConversationId, {
        limit: 10,
        offset: 0,
      });

      // Get second page (10 messages)
      const page2 = await repository.getByConversationId(testConversationId, {
        limit: 10,
        offset: 10,
      });

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page1[0].content).toBe('Message 1');
      expect(page2[0].content).toBe('Message 11');
    });
  });
});
