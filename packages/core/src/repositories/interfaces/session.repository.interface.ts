/**
 * Session Repository Interface
 *
 * Defines the contract for session data persistence operations.
 * Part of the Clean Architecture domain layer - inner layers define the interface,
 * outer layers (infrastructure) implement it.
 */

import { Session } from '../../domain/entities/Session.js';

// Re-export Session for use by other modules
export { Session };

/**
 * Data required to create a new session
 * Note: Uses string for expiresAt to match database storage format
 */
export interface CreateSessionData {
  userId: string;
  refreshToken: string;
  expiresAt: string;
}

/**
 * Repository interface for session persistence operations
 *
 * This interface follows the Repository pattern from Clean Architecture.
 * Infrastructure layer will provide concrete implementations.
 */
export interface ISessionRepository {
  /**
   * Retrieves all sessions for a specific user
   * @param userId - The user's unique identifier
   * @returns Promise resolving to array of sessions
   */
  getByUserId(userId: string): Promise<Session[]>;

  /**
   * Finds a session by its refresh token
   * @param token - The refresh token to search for
   * @returns Promise resolving to session or null if not found
   */
  getByRefreshToken(token: string): Promise<Session | null>;

  /**
   * Creates a new session
   * @param sessionData - Data required to create the session
   * @returns Promise resolving to the created session
   */
  create(sessionData: CreateSessionData): Promise<Session>;

  /**
   * Deletes a session by its ID
   * @param id - The session's unique identifier
   * @returns Promise that resolves when deletion is complete
   */
  delete(id: string): Promise<void>;

  /**
   * Removes all expired sessions from the database
   * Useful for periodic cleanup operations
   * @returns Promise resolving to the count of deleted sessions
   */
  deleteExpired(): Promise<number>;

  /**
   * Legacy aliases - kept for backwards compatibility
   */
  findById?(id: string): Promise<Session | null>;
  findActiveByUserId?(userId: string): Promise<Session[]>;
  findByRefreshToken?(refreshToken: string): Promise<Session | null>;
  save?(session: Session): Promise<Session>;
  invalidate?(id: string): Promise<void>;
  invalidateAll?(userId: string): Promise<void>;
}
