/**
 * ConversationRepository Test Suite
 *
 * Comprehensive tests for conversation repository implementation.
 * Uses in-memory SQLite database for isolated testing.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '@anplexa/database';
import {
  ConversationRepository,
  ConversationNotFoundError,
  ConversationRepositoryError,
} from '../conversation.repository.js';
import type { Database as DatabaseType } from '@anplexa/database';

describe('ConversationRepository', () => {
  let db: DatabaseType;
  let sqliteDb: Database.Database;
  let repository: ConversationRepository;

  // Test user IDs
  const userId1 = 'user-1';
  const userId2 = 'user-2';

  beforeEach(async () => {
    // Create in-memory SQLite database
    sqliteDb = new Database(':memory:');
    db = drizzle(sqliteDb, { schema }) as DatabaseType;

    // Create tables
    sqliteDb.exec(`
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
        user_id TEXT NOT NULL,
        title TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );
    `);

    // Insert test users
    sqliteDb.exec(`
      INSERT INTO users (id, email, password_hash) VALUES 
        ('${userId1}', 'user1@test.com', 'hash1'),
        ('${userId2}', 'user2@test.com', 'hash2');
    `);

    repository = new ConversationRepository(db);
  });

  afterEach(() => {
    sqliteDb.close();
  });

  describe('create', () => {
    it('should create a new conversation with title', async () => {
      const conversationData = {
        id: 'conv-1',
        userId: userId1,
        title: 'Test Conversation',
      };

      const result = await repository.create(conversationData);

      expect(result).toMatchObject({
        id: 'conv-1',
        userId: userId1,
        title: 'Test Conversation',
      });
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should create a conversation without title', async () => {
      const conversationData = {
        id: 'conv-2',
        userId: userId1,
      };

      const result = await repository.create(conversationData);

      expect(result).toMatchObject({
        id: 'conv-2',
        userId: userId1,
        title: null,
      });
    });

    it('should create a conversation with custom timestamps', async () => {
      const customDate = '2024-01-01T00:00:00.000Z';
      const conversationData = {
        id: 'conv-3',
        userId: userId1,
        title: 'Custom Date',
        createdAt: customDate,
        updatedAt: customDate,
      };

      const result = await repository.create(conversationData);

      expect(result.createdAt).toBe(customDate);
      expect(result.updatedAt).toBe(customDate);
    });

    it('should throw error when creating conversation with duplicate id', async () => {
      const conversationData = {
        id: 'conv-1',
        userId: userId1,
        title: 'First',
      };

      await repository.create(conversationData);

      await expect(
        repository.create(conversationData)
      ).rejects.toThrow(ConversationRepositoryError);
    });
  });

  describe('getById', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'conv-1',
        userId: userId1,
        title: 'Test Conversation',
      });
    });

    it('should return conversation when found', async () => {
      const result = await repository.getById('conv-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('conv-1');
      expect(result?.title).toBe('Test Conversation');
    });

    it('should return null when conversation not found', async () => {
      const result = await repository.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getByUserId', () => {
    beforeEach(async () => {
      // Create conversations for user1
      await repository.create({
        id: 'conv-1',
        userId: userId1,
        title: 'Conversation 1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      await repository.create({
        id: 'conv-2',
        userId: userId1,
        title: 'Conversation 2',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
      });
      await repository.create({
        id: 'conv-3',
        userId: userId1,
        title: 'Conversation 3',
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      });

      // Create conversation for user2
      await repository.create({
        id: 'conv-4',
        userId: userId2,
        title: 'User 2 Conversation',
      });
    });

    it('should return all conversations for a user', async () => {
      const results = await repository.getByUserId(userId1);

      expect(results).toHaveLength(3);
      expect(results.every(c => c.userId === userId1)).toBe(true);
    });

    it('should order conversations by updatedAt descending', async () => {
      const results = await repository.getByUserId(userId1);

      expect(results[0].id).toBe('conv-2'); // Latest updated
      expect(results[1].id).toBe('conv-3');
      expect(results[2].id).toBe('conv-1');
    });

    it('should return empty array for user with no conversations', async () => {
      const results = await repository.getByUserId('user-3');

      expect(results).toHaveLength(0);
    });

    it('should respect pagination limit', async () => {
      const results = await repository.getByUserId(userId1, { limit: 2 });

      expect(results).toHaveLength(2);
    });

    it('should respect pagination offset', async () => {
      const results = await repository.getByUserId(userId1, { offset: 1 });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('conv-3');
    });

    it('should handle limit and offset together', async () => {
      const results = await repository.getByUserId(userId1, {
        limit: 1,
        offset: 1,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('conv-3');
    });

    it('should use default pagination values when not provided', async () => {
      // Create more conversations to test default limit (starting from a high number to avoid conflicts)
      for (let i = 100; i <= 156; i++) {
        await repository.create({
          id: `conv-${i}`,
          userId: userId1,
          title: `Conversation ${i}`,
        });
      }

      const results = await repository.getByUserId(userId1);

      expect(results).toHaveLength(50); // Default limit
    });
  });

  describe('searchByContent', () => {
    beforeEach(async () => {
      // Create conversations with messages
      await repository.create({
        id: 'conv-1',
        userId: userId1,
        title: 'JavaScript Tutorial',
      });
      await repository.create({
        id: 'conv-2',
        userId: userId1,
        title: 'Python Guide',
      });
      await repository.create({
        id: 'conv-3',
        userId: userId1,
        title: 'Database Design',
      });
      await repository.create({
        id: 'conv-4',
        userId: userId2,
        title: 'JavaScript Advanced',
      });

      // Insert messages
      sqliteDb.exec(`
        INSERT INTO messages (id, conversation_id, role, content) VALUES
          ('msg-1', 'conv-1', 'user', 'How do I learn JavaScript?'),
          ('msg-2', 'conv-1', 'assistant', 'Start with the basics of JavaScript'),
          ('msg-3', 'conv-2', 'user', 'What is Python used for?'),
          ('msg-4', 'conv-2', 'assistant', 'Python is great for data science'),
          ('msg-5', 'conv-3', 'user', 'How to design a database?'),
          ('msg-6', 'conv-4', 'user', 'Advanced JavaScript patterns');
      `);
    });

    it('should find conversations by title match', async () => {
      const results = await repository.searchByContent(userId1, 'JavaScript');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Tutorial');
    });

    it('should find conversations by message content match', async () => {
      const results = await repository.searchByContent(userId1, 'data science');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Python Guide');
    });

    it('should return distinct conversations when multiple messages match', async () => {
      const results = await repository.searchByContent(userId1, 'JavaScript');

      expect(results).toHaveLength(1);
    });

    it('should be case-insensitive', async () => {
      const results = await repository.searchByContent(userId1, 'javascript');

      expect(results).toHaveLength(1);
    });

    it('should only return conversations for specified user', async () => {
      const results = await repository.searchByContent(userId1, 'JavaScript');

      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe(userId1);
    });

    it('should return empty array when no matches found', async () => {
      const results = await repository.searchByContent(userId1, 'Ruby');

      expect(results).toHaveLength(0);
    });

    it('should handle partial word matches', async () => {
      const results = await repository.searchByContent(userId1, 'base');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Database Design');
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'conv-1',
        userId: userId1,
        title: 'Original Title',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should update conversation title', async () => {
      const result = await repository.update('conv-1', {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
      expect(result.updatedAt).not.toBe('2024-01-01T00:00:00.000Z');
    });

    it('should update updatedAt timestamp automatically', async () => {
      const before = new Date().toISOString();
      
      const result = await repository.update('conv-1', {
        title: 'New Title',
      });

      expect(result.updatedAt >= before).toBe(true);
    });

    it('should throw ConversationNotFoundError when conversation does not exist', async () => {
      await expect(
        repository.update('non-existent', { title: 'New Title' })
      ).rejects.toThrow(ConversationNotFoundError);
    });

    it('should update only specified fields', async () => {
      const result = await repository.update('conv-1', {
        title: 'Partial Update',
      });

      expect(result.id).toBe('conv-1');
      expect(result.userId).toBe(userId1);
      expect(result.title).toBe('Partial Update');
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'conv-1',
        userId: userId1,
        title: 'To Delete',
      });

      // Add messages to the conversation
      sqliteDb.exec(`
        INSERT INTO messages (id, conversation_id, role, content) VALUES
          ('msg-1', 'conv-1', 'user', 'Hello'),
          ('msg-2', 'conv-1', 'assistant', 'Hi there');
      `);
    });

    it('should delete conversation successfully', async () => {
      await repository.delete('conv-1');

      const result = await repository.getById('conv-1');
      expect(result).toBeNull();
    });

    it('should delete associated messages', async () => {
      await repository.delete('conv-1');

      const messagesCount = sqliteDb
        .prepare('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?')
        .get('conv-1') as { count: number };

      expect(messagesCount.count).toBe(0);
    });

    it('should throw ConversationNotFoundError when conversation does not exist', async () => {
      await expect(
        repository.delete('non-existent')
      ).rejects.toThrow(ConversationNotFoundError);
    });

    it('should not affect other conversations when deleting one', async () => {
      await repository.create({
        id: 'conv-2',
        userId: userId1,
        title: 'Keep This',
      });

      await repository.delete('conv-1');

      const result = await repository.getById('conv-2');
      expect(result).not.toBeNull();
    });
  });

  describe('error handling', () => {
    it('should wrap database errors in ConversationRepositoryError', async () => {
      // Close the database to cause an error
      sqliteDb.close();

      await expect(
        repository.getById('conv-1')
      ).rejects.toThrow(ConversationRepositoryError);
    });

    it('should preserve ConversationNotFoundError in update', async () => {
      const error = await repository.update('non-existent', {
        title: 'Test',
      }).catch(e => e);

      expect(error).toBeInstanceOf(ConversationNotFoundError);
      expect(error.message).toContain('non-existent');
    });

    it('should preserve ConversationNotFoundError in delete', async () => {
      const error = await repository.delete('non-existent').catch(e => e);

      expect(error).toBeInstanceOf(ConversationNotFoundError);
      expect(error.message).toContain('non-existent');
    });
  });

  describe('edge cases', () => {
    it('should handle empty title', async () => {
      const result = await repository.create({
        id: 'conv-1',
        userId: userId1,
        title: '',
      });

      // Empty strings are converted to null by the repository
      expect(result.title).toBeNull();
    });

    it('should handle null title', async () => {
      const result = await repository.create({
        id: 'conv-1',
        userId: userId1,
        title: null,
      });

      expect(result.title).toBeNull();
    });

    it('should handle very long titles', async () => {
      const longTitle = 'A'.repeat(1000);
      const result = await repository.create({
        id: 'conv-1',
        userId: userId1,
        title: longTitle,
      });

      expect(result.title).toBe(longTitle);
    });

    it('should handle special characters in search', async () => {
      await repository.create({
        id: 'conv-1',
        userId: userId1,
        title: "Test's \"quotes\" & special",
      });

      const results = await repository.searchByContent(userId1, 'quotes');
      expect(results).toHaveLength(1);
    });

    it('should handle concurrent creates', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        repository.create({
          id: `conv-${i}`,
          userId: userId1,
          title: `Conversation ${i}`,
        })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
    });
  });
});
