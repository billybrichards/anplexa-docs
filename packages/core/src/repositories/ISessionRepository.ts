/**
 * Session Repository Interface
 *
 * Defines the contract for session persistence operations.
 * Implemented by infrastructure layer (e.g., DrizzleSessionRepository, RedisSessionRepository)
 */

import type { Session } from '../domain/entities/Session.js';

export interface ISessionRepository {
  /**
   * Find a session by ID
   * @param id - Session ID
   * @returns Session entity or null if not found
   */
  findById(id: string): Promise<Session | null>;

  /**
   * Find active sessions for a user
   * @param userId - User ID
   * @returns Array of active session entities
   */
  findActiveByUserId(userId: string): Promise<Session[]>;

  /**
   * Save a session (create or update)
   * @param session - Session entity to persist
   * @returns Persisted session entity
   */
  save(session: Session): Promise<Session>;

  /**
   * Invalidate a session
   * @param id - Session ID
   */
  invalidate(id: string): Promise<void>;

  /**
   * Invalidate all sessions for a user
   * @param userId - User ID
   */
  invalidateAll(userId: string): Promise<void>;

  /**
   * Find session by refresh token
   * @param refreshToken - Refresh token
   * @returns Session entity or null if not found
   */
  findByRefreshToken(refreshToken: string): Promise<Session | null>;
}
