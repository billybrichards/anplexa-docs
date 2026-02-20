/**
 * User Feedback Repository Interface
 *
 * Defines the contract for user feedback data access operations.
 * Part of the Clean Architecture repository pattern.
 */

import type { UserFeedback } from '@anplexa/database';

export interface CreateUserFeedbackData {
  id: string;
  userId: string;
  type: string;
  content: string;
}

export interface UserFeedbackStats {
  totalFeedback: number;
  feedbackCount: number;
  featureRequestCount: number;
}

export interface IUserFeedbackRepository {
  /**
   * Get all user feedback records
   */
  getAll(): Promise<UserFeedback[]>;

  /**
   * Get user feedback records by user ID
   * @param userId - The user ID to filter by
   */
  getByUserId(userId: string): Promise<UserFeedback[]>;

  /**
   * Get user feedback records by type
   * @param type - The feedback type to filter by (e.g., 'feedback', 'feature')
   */
  getByType(type: string): Promise<UserFeedback[]>;

  /**
   * Get user feedback statistics
   */
  getStats(): Promise<UserFeedbackStats>;

  /**
   * Create a new user feedback record
   * @param data - User feedback creation data
   */
  create(data: CreateUserFeedbackData): Promise<UserFeedback>;

  /**
   * Delete user feedback record by ID
   * @param id - The feedback ID to delete
   */
  deleteById(id: string): Promise<void>;

  /**
   * Delete all user feedback records for a specific user
   * @param userId - The user ID whose feedback should be deleted
   * @returns Number of records deleted
   */
  deleteByUserId(userId: string): Promise<number>;
}
