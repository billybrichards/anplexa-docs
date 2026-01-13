/**
 * Session Repository Implementation
 *
 * Concrete implementation of ISessionRepository using Drizzle ORM.
 * This is part of the infrastructure layer in Clean Architecture.
 */

import { eq, lt } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { Database } from '@anplexa/database';
import { sessions } from '@anplexa/database';
import type {
  ISessionRepository,
  Session,
  CreateSessionData,
} from './interfaces/session.repository.interface.js';

/**
 * Drizzle ORM implementation of the Session Repository
 *
 * Handles all session-related database operations including:
 * - User session lookups
 * - Refresh token validation
 * - Session creation and deletion
 * - Expired session cleanup
 */
export class SessionRepository implements ISessionRepository {
  constructor(private readonly db: Database) {}

  /**
   * Retrieves all active sessions for a specific user
   *
   * @param userId - The user's unique identifier
   * @returns Promise resolving to array of sessions (empty array if none found)
   * @throws Error if database query fails
   */
  async getByUserId(userId: string): Promise<Session[]> {
    try {
      const results = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId));

      return results.map(this.mapToSession);
    } catch (error) {
      throw new Error(
        `Failed to retrieve sessions for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a session by its refresh token
   *
   * Used during token refresh operations to validate the refresh token
   * and retrieve the associated session.
   *
   * @param token - The refresh token to search for
   * @returns Promise resolving to session or null if not found
   * @throws Error if database query fails
   */
  async getByRefreshToken(token: string): Promise<Session | null> {
    try {
      const results = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.refreshToken, token))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.mapToSession(results[0]);
    } catch (error) {
      throw new Error(
        `Failed to retrieve session by refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Creates a new session in the database
   *
   * Generates a unique ID for the session and sets the creation timestamp.
   *
   * @param sessionData - Data required to create the session
   * @returns Promise resolving to the created session
   * @throws Error if database insertion fails
   */
  async create(sessionData: CreateSessionData): Promise<Session> {
    try {
      const id = randomUUID();
      const createdAt = new Date().toISOString();

      const sessionToInsert = {
        id,
        userId: sessionData.userId,
        refreshToken: sessionData.refreshToken,
        expiresAt: sessionData.expiresAt,
        createdAt,
      };

      await this.db.insert(sessions).values(sessionToInsert);

      return this.mapToSession(sessionToInsert);
    } catch (error) {
      throw new Error(
        `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes a session by its ID
   *
   * Used for logging out or invalidating specific sessions.
   *
   * @param id - The session's unique identifier
   * @returns Promise that resolves when deletion is complete
   * @throws Error if database deletion fails
   */
  async delete(id: string): Promise<void> {
    try {
      await this.db.delete(sessions).where(eq(sessions.id, id));
    } catch (error) {
      throw new Error(
        `Failed to delete session ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Removes all expired sessions from the database
   *
   * This method performs a cleanup operation to remove sessions that have
   * passed their expiration time. Should be called periodically (e.g., via
   * a cron job or scheduled task).
   *
   * @returns Promise resolving to the count of deleted sessions
   * @throws Error if database deletion fails
   */
  async deleteExpired(): Promise<number> {
    try {
      const now = new Date().toISOString();

      // First, count the expired sessions
      const expiredSessions = await this.db
        .select()
        .from(sessions)
        .where(lt(sessions.expiresAt, now));

      const count = expiredSessions.length;

      // Delete expired sessions
      if (count > 0) {
        await this.db.delete(sessions).where(lt(sessions.expiresAt, now));
      }

      return count;
    } catch (error) {
      throw new Error(
        `Failed to delete expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Maps a database row to a Session entity
   *
   * @param row - The raw database row
   * @returns Session entity with proper typing
   */
  private mapToSession(row: {
    id: string;
    userId: string;
    refreshToken: string;
    expiresAt: string;
    createdAt: string | null;
  }): Session {
    return {
      id: row.id,
      userId: row.userId,
      refreshToken: row.refreshToken,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt || new Date().toISOString(),
    };
  }

}
