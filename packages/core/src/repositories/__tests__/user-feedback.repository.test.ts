/**
 * User Feedback Repository Unit Tests
 *
 * Comprehensive test suite for UserFeedbackRepository using SQLite in-memory database.
 * Tests all query and command methods with various edge cases and statistics calculations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { userFeedback, type UserFeedback } from '@anplexa/database/schema/sqlite';
import { UserFeedbackRepository } from '../user-feedback.repository';
import type { CreateUserFeedbackData } from '../interfaces/user-feedback.repository.interface';

describe('UserFeedbackRepository', () => {
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle>;
  let repository: UserFeedbackRepository;

  const baseUserFeedback: CreateUserFeedbackData = {
    id: 'feedback-1',
    userId: 'user-1',
    type: 'feedback',
    content: 'Great app, love the UI!',
  };

  beforeEach(() => {
    sqliteDb = new Database(':memory:');
    db = drizzle(sqliteDb, { schema: { userFeedback } });

    sqliteDb.exec(
      'CREATE TABLE IF NOT EXISTS user_feedback (' +
        'id TEXT PRIMARY KEY, ' +
        'user_id TEXT, ' +
        'type TEXT NOT NULL, ' +
        'content TEXT NOT NULL, ' +
        'created_at TEXT DEFAULT CURRENT_TIMESTAMP' +
        ')'
    );

    repository = new UserFeedbackRepository(db);
  });

  afterEach(() => {
    sqliteDb.close();
  });

  describe('create', () => {
    it('should create a new user feedback record successfully', async () => {
      const feedback = await repository.create(baseUserFeedback);

      expect(feedback).toBeDefined();
      expect(feedback.id).toBe(baseUserFeedback.id);
      expect(feedback.userId).toBe(baseUserFeedback.userId);
      expect(feedback.type).toBe(baseUserFeedback.type);
      expect(feedback.content).toBe(baseUserFeedback.content);
      expect(feedback.createdAt).toBeDefined();
    });

    it('should create a feature request', async () => {
      const featureRequest: CreateUserFeedbackData = {
        id: 'feature-1',
        userId: 'user-2',
        type: 'feature',
        content: 'Please add dark mode support',
      };

      const feedback = await repository.create(featureRequest);

      expect(feedback.type).toBe('feature');
      expect(feedback.content).toContain('dark mode');
    });

    it('should create multiple feedback records for the same user', async () => {
      const feedback1 = await repository.create({
        ...baseUserFeedback,
        id: 'feedback-1',
      });

      const feedback2 = await repository.create({
        ...baseUserFeedback,
        id: 'feedback-2',
        content: 'Another feedback',
      });

      expect(feedback1.id).toBe('feedback-1');
      expect(feedback2.id).toBe('feedback-2');

      const userFeedbacks = await repository.getByUserId('user-1');
      expect(userFeedbacks).toHaveLength(2);
    });

    it('should throw error when required fields are missing', async () => {
      const incompleteData = {
        id: '',
        userId: 'user-1',
        type: 'feedback',
        content: 'Test',
      } as any;

      await expect(repository.create(incompleteData)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should throw error when content is missing', async () => {
      const incompleteData = {
        id: 'feedback-1',
        userId: 'user-1',
        type: 'feedback',
        content: '',
      } as any;

      await expect(repository.create(incompleteData)).rejects.toThrow(
        'Missing required fields'
      );
    });
  });

  describe('getAll', () => {
    it('should return empty array when no records exist', async () => {
      const records = await repository.getAll();
      expect(records).toHaveLength(0);
    });

    it('should return all created feedback records', async () => {
      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-1',
      });

      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-2',
        userId: 'user-2',
      });

      const records = await repository.getAll();
      expect(records).toHaveLength(2);
    });

    it('should return mixed feedback and feature requests', async () => {
      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-1',
        type: 'feedback',
      });

      await repository.create({
        ...baseUserFeedback,
        id: 'feature-1',
        type: 'feature',
      });

      const records = await repository.getAll();
      expect(records).toHaveLength(2);
    });
  });

  describe('getByUserId', () => {
    it('should return empty array for non-existent user', async () => {
      const records = await repository.getByUserId('non-existent-user');
      expect(records).toHaveLength(0);
    });

    it('should return feedback records for a specific user', async () => {
      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-1',
        userId: 'user-1',
      });

      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-2',
        userId: 'user-1',
      });

      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-3',
        userId: 'user-2',
      });

      const user1Feedback = await repository.getByUserId('user-1');
      const user2Feedback = await repository.getByUserId('user-2');

      expect(user1Feedback).toHaveLength(2);
      expect(user2Feedback).toHaveLength(1);
    });
  });

  describe('getByType', () => {
    it('should return empty array for non-existent type', async () => {
      const records = await repository.getByType('non-existent-type');
      expect(records).toHaveLength(0);
    });

    it('should return feedback records by type', async () => {
      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-1',
        type: 'feedback',
      });

      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-2',
        type: 'feedback',
      });

      await repository.create({
        ...baseUserFeedback,
        id: 'feature-1',
        type: 'feature',
      });

      const feedbackRecords = await repository.getByType('feedback');
      const featureRecords = await repository.getByType('feature');

      expect(feedbackRecords).toHaveLength(2);
      expect(featureRecords).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return zero stats when no records exist', async () => {
      const stats = await repository.getStats();

      expect(stats.totalFeedback).toBe(0);
      expect(stats.feedbackCount).toBe(0);
      expect(stats.featureRequestCount).toBe(0);
    });

    it('should calculate feedback and feature request counts', async () => {
      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-1',
        type: 'feedback',
      });

      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-2',
        type: 'feedback',
      });

      await repository.create({
        ...baseUserFeedback,
        id: 'feature-1',
        type: 'feature',
      });

      const stats = await repository.getStats();

      expect(stats.totalFeedback).toBe(3);
      expect(stats.feedbackCount).toBe(2);
      expect(stats.featureRequestCount).toBe(1);
    });

    it('should handle only feedback records', async () => {
      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-1',
        type: 'feedback',
      });

      const stats = await repository.getStats();

      expect(stats.totalFeedback).toBe(1);
      expect(stats.feedbackCount).toBe(1);
      expect(stats.featureRequestCount).toBe(0);
    });

    it('should handle only feature requests', async () => {
      await repository.create({
        ...baseUserFeedback,
        id: 'feature-1',
        type: 'feature',
      });

      const stats = await repository.getStats();

      expect(stats.totalFeedback).toBe(1);
      expect(stats.feedbackCount).toBe(0);
      expect(stats.featureRequestCount).toBe(1);
    });
  });

  describe('deleteById', () => {
    it('should delete a feedback record by ID', async () => {
      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-1',
      });

      await repository.deleteById('feedback-1');

      const records = await repository.getAll();
      expect(records).toHaveLength(0);
    });

    it('should throw error when deleting non-existent feedback', async () => {
      await expect(repository.deleteById('non-existent-id')).rejects.toThrow(
        'not found'
      );
    });

    it('should only delete the specific feedback record', async () => {
      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-1',
      });

      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-2',
      });

      await repository.deleteById('feedback-1');

      const records = await repository.getAll();
      expect(records).toHaveLength(1);
      expect(records[0].id).toBe('feedback-2');
    });
  });

  describe('deleteByUserId', () => {
    it('should return 0 for non-existent user', async () => {
      const deletedCount = await repository.deleteByUserId('non-existent-user');
      expect(deletedCount).toBe(0);
    });

    it('should delete all feedback records for a user', async () => {
      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-1',
        userId: 'user-1',
      });

      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-2',
        userId: 'user-1',
      });

      const deletedCount = await repository.deleteByUserId('user-1');

      expect(deletedCount).toBe(2);

      const records = await repository.getByUserId('user-1');
      expect(records).toHaveLength(0);
    });

    it('should only delete feedback for the specified user', async () => {
      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-1',
        userId: 'user-1',
      });

      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-2',
        userId: 'user-2',
      });

      const deletedCount = await repository.deleteByUserId('user-1');

      expect(deletedCount).toBe(1);

      const user1Feedback = await repository.getByUserId('user-1');
      const user2Feedback = await repository.getByUserId('user-2');

      expect(user1Feedback).toHaveLength(0);
      expect(user2Feedback).toHaveLength(1);
    });

    it('should return the count of deleted records', async () => {
      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-1',
        userId: 'user-1',
      });

      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-2',
        userId: 'user-1',
      });

      await repository.create({
        ...baseUserFeedback,
        id: 'feedback-3',
        userId: 'user-1',
      });

      const deletedCount = await repository.deleteByUserId('user-1');
      expect(deletedCount).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      sqliteDb.close();
      await expect(repository.getAll()).rejects.toThrow();
    });

    it('should handle creation errors with proper messages', async () => {
      const invalidData = {
        id: 'test',
        userId: 'user-1',
        type: '',
        content: 'test',
      } as any;

      await expect(repository.create(invalidData)).rejects.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex workflow with multiple operations', async () => {
      await repository.create({
        id: 'feedback-1',
        userId: 'user-1',
        type: 'feedback',
        content: 'Great app',
      });

      await repository.create({
        id: 'feature-1',
        userId: 'user-1',
        type: 'feature',
        content: 'Add dark mode',
      });

      await repository.create({
        id: 'feedback-2',
        userId: 'user-2',
        type: 'feedback',
        content: 'Need improvement',
      });

      let stats = await repository.getStats();
      expect(stats.totalFeedback).toBe(3);

      const deletedCount = await repository.deleteByUserId('user-1');
      expect(deletedCount).toBe(2);

      stats = await repository.getStats();
      expect(stats.totalFeedback).toBe(1);

      const user2Feedback = await repository.getByUserId('user-2');
      expect(user2Feedback).toHaveLength(1);
      expect(user2Feedback[0].content).toBe('Need improvement');
    });
  });
});
