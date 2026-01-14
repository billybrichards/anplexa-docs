"use strict";
/**
 * Session Domain Entity
 *
 * Represents an authenticated session for a user.
 * Used for tracking user login sessions and refresh tokens.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
class Session {
    id;
    userId;
    refreshToken;
    expiresAt;
    createdAt;
    isActive;
    constructor(id, userId, refreshToken, expiresAt, createdAt = new Date(), isActive = true) {
        this.id = id;
        this.userId = userId;
        this.refreshToken = refreshToken;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
        this.isActive = isActive;
    }
    /**
     * Check if the session has expired
     * @returns true if session has expired
     */
    isExpired() {
        return new Date() > this.expiresAt;
    }
    /**
     * Check if the session is still valid
     * @returns true if session is valid (active and not expired)
     */
    isValid() {
        return this.isActive && !this.isExpired();
    }
    /**
     * Create a new session instance
     * @param data - Session creation data
     * @returns New Session instance
     */
    static create(data) {
        return new Session(data.id, data.userId, data.refreshToken, data.expiresAt, data.createdAt ?? new Date(), data.isActive ?? true);
    }
}
exports.Session = Session;
