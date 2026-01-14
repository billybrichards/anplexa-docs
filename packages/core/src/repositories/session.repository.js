"use strict";
/**
 * Session Repository Implementation
 *
 * Concrete implementation of ISessionRepository using Drizzle ORM.
 * This is part of the infrastructure layer in Clean Architecture.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRepository = void 0;
const crypto_1 = require("crypto");
const database_1 = require("@anplexa/database");
const Session_js_1 = require("../domain/entities/Session.js");
/**
 * Drizzle ORM implementation of the Session Repository
 *
 * Handles all session-related database operations including:
 * - User session lookups
 * - Refresh token validation
 * - Session creation and deletion
 * - Expired session cleanup
 */
class SessionRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Retrieves all active sessions for a specific user
     *
     * @param userId - The user's unique identifier
     * @returns Promise resolving to array of sessions (empty array if none found)
     * @throws Error if database query fails
     */
    async getByUserId(userId) {
        try {
            const results = await this.db
                .select()
                .from(database_1.sessions)
                .where((0, database_1.eq)(database_1.sessions.userId, userId));
            return results.map(this.mapToSession);
        }
        catch (error) {
            throw new Error(`Failed to retrieve sessions for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    async getByRefreshToken(token) {
        try {
            const results = await this.db
                .select()
                .from(database_1.sessions)
                .where((0, database_1.eq)(database_1.sessions.refreshToken, token))
                .limit(1);
            if (results.length === 0) {
                return null;
            }
            return this.mapToSession(results[0]);
        }
        catch (error) {
            throw new Error(`Failed to retrieve session by refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    async create(sessionData) {
        try {
            const id = (0, crypto_1.randomUUID)();
            const createdAt = new Date().toISOString();
            const sessionToInsert = {
                id,
                userId: sessionData.userId,
                refreshToken: sessionData.refreshToken,
                expiresAt: sessionData.expiresAt,
                createdAt,
            };
            await this.db.insert(database_1.sessions).values(sessionToInsert);
            return this.mapToSession(sessionToInsert);
        }
        catch (error) {
            throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    async delete(id) {
        try {
            await this.db.delete(database_1.sessions).where((0, database_1.eq)(database_1.sessions.id, id));
        }
        catch (error) {
            throw new Error(`Failed to delete session ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    async deleteExpired() {
        try {
            const now = new Date().toISOString();
            // First, count the expired sessions
            const expiredSessions = await this.db
                .select()
                .from(database_1.sessions)
                .where((0, database_1.lt)(database_1.sessions.expiresAt, now));
            const count = expiredSessions.length;
            // Delete expired sessions
            if (count > 0) {
                await this.db.delete(database_1.sessions).where((0, database_1.lt)(database_1.sessions.expiresAt, now));
            }
            return count;
        }
        catch (error) {
            throw new Error(`Failed to delete expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Maps a database row to a Session domain entity
     *
     * Converts database string timestamps to Date objects for domain layer
     *
     * @param row - The raw database row
     * @returns Session domain entity
     */
    mapToSession(row) {
        return new Session_js_1.Session(row.id, row.userId, row.refreshToken, new Date(row.expiresAt), row.createdAt ? new Date(row.createdAt) : new Date(), true // isActive
        );
    }
}
exports.SessionRepository = SessionRepository;
