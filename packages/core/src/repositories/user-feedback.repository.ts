/**
 * User Feedback Repository Implementation
 *
 * Implements the IUserFeedbackRepository interface using Drizzle ORM.
 * Handles all user feedback data access operations.
 */

import type { Database } from '@anplexa/database';
import { userFeedback, type UserFeedback, eq } from '@anplexa/database';
import type {
  IUserFeedbackRepository,
  CreateUserFeedbackData,
  UserFeedbackStats,
} from './interfaces/user-feedback.repository.interface';

export class UserFeedbackRepository implements IUserFeedbackRepository {
  constructor(private readonly db: Database) {}

  /**
   * Get all user feedback records
   */
  async getAll(): Promise<UserFeedback[]> {
    try {
      return await this.db.select().from(userFeedback);
    } catch (error) {
      throw new Error(
        `Failed to get all user feedback: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get user feedback records by user ID
   */
  async getByUserId(userId: string): Promise<UserFeedback[]> {
    try {
      return await this.db.select().from(userFeedback).where(eq(userFeedback.userId, userId));
    } catch (error) {
      throw new Error(
        `Failed to get user feedback by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get user feedback records by type
   */
  async getByType(type: string): Promise<UserFeedback[]> {
    try {
      return await this.db.select().from(userFeedback).where(eq(userFeedback.type, type));
    } catch (error) {
      throw new Error(
        `Failed to get user feedback by type: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get user feedback statistics
   */
  async getStats(): Promise<UserFeedbackStats> {
    try {
      const allFeedback = await this.getAll();
      const feedbackRecords = await this.getByType('feedback');
      const featureRequests = await this.getByType('feature');

      return {
        totalFeedback: allFeedback.length,
        feedbackCount: feedbackRecords.length,
        featureRequestCount: featureRequests.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to get user feedback stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a new user feedback record
   */
  async create(data: CreateUserFeedbackData): Promise<UserFeedback> {
    try {
      // Validate required fields
      if (!data.id || !data.userId || !data.type || !data.content) {
        throw new Error('Missing required fields for feedback creation');
      }

      const newFeedback = {
        id: data.id,
        userId: data.userId,
        type: data.type,
        content: data.content,
        createdAt: new Date().toISOString(),
      } as any;

      await this.db.insert(userFeedback).values(newFeedback);

      // Return the created feedback
      const results = await this.db
        .select()
        .from(userFeedback)
        .where(eq(userFeedback.id, data.id));

      if (!results[0]) {
        throw new Error('Failed to retrieve created user feedback');
      }

      return results[0];
    } catch (error) {
      throw new Error(
        `Failed to create user feedback: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete user feedback record by ID
   */
  async deleteById(id: string): Promise<void> {
    try {
      // Check if feedback exists
      const results = await this.db
        .select()
        .from(userFeedback)
        .where(eq(userFeedback.id, id))
        .limit(1);

      if (!results[0]) {
        throw new Error(`User feedback with id ${id} not found`);
      }

      // Delete the feedback
      await this.db.delete(userFeedback).where(eq(userFeedback.id, id));
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Failed to delete user feedback: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete all user feedback records for a specific user
   */
  async deleteByUserId(userId: string): Promise<number> {
    try {
      // Get feedback records for this user to count them
      const userFeedbackRecords = await this.getByUserId(userId);
      const count = userFeedbackRecords.length;

      // Delete all feedback for this user
      await this.db.delete(userFeedback).where(eq(userFeedback.userId, userId));

      return count;
    } catch (error) {
      throw new Error(
        `Failed to delete user feedback by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
