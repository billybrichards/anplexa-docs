/**
 * User Repository Interface
 *
 * Defines the contract for user persistence operations.
 * Implemented by infrastructure layer (e.g., DrizzleUserRepository)
 */

import type { User } from '../domain/entities/User.js';

export interface IUserRepository {
  /**
   * Find a user by their unique ID
   * @param id - User ID
   * @returns User entity or null if not found
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find a user by their email address
   * @param email - Email address
   * @returns User entity or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Save a user (create or update)
   * @param user - User entity to persist
   * @returns Persisted user entity
   */
  save(user: User): Promise<User>;

  /**
   * Delete a user by ID
   * @param id - User ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if email exists
   * @param email - Email address
   * @returns true if email exists, false otherwise
   */
  emailExists(email: string): Promise<boolean>;
}
