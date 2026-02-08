/* global process */
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
/**
 * Parse duration string to seconds
 * Supports: s (seconds), m (minutes), h (hours), d (days)
 * @example
 * parseDuration('15m') => 900
 * parseDuration('7d') => 604800
 */
function parseDuration(duration) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match)
        return 900; // Default 15 minutes
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 60 * 60;
        case 'd': return value * 60 * 60 * 24;
        default: return 900;
    }
}
/**
 * JWT Service
 * Handles token generation, verification, and refresh
 *
 * @example
 * const jwtService = new JWTService({
 *   secret: process.env.JWT_SECRET,
 *   accessTokenExpiry: '15m',
 *   refreshTokenExpiry: '7d',
 * });
 *
 * const tokens = jwtService.generateTokenPair('user-123', 'user@example.com', false);
 * const payload = jwtService.verifyAccessToken(tokens.accessToken);
 */
export class JWTService {
    config;
    constructor(config) {
        if (!config.secret) {
            throw new Error('JWT secret is required');
        }
        this.config = config;
    }
    /**
     * Generate access and refresh token pair
     */
    generateTokenPair(userId, email, isAdmin) {
        const accessExpiresIn = parseDuration(this.config.accessTokenExpiry);
        const refreshExpiresIn = parseDuration(this.config.refreshTokenExpiry);
        const accessToken = jwt.sign({ sub: userId, email, isAdmin, type: 'access' }, this.config.secret, { expiresIn: accessExpiresIn });
        const refreshToken = jwt.sign({ sub: userId, email, isAdmin, type: 'refresh' }, this.config.secret, { expiresIn: refreshExpiresIn });
        return {
            accessToken,
            refreshToken,
            expiresIn: accessExpiresIn,
            refreshExpiresIn: refreshExpiresIn,
        };
    }
    /**
     * Verify an access token and return payload
     * Returns null if token is invalid or expired
     */
    verifyAccessToken(token) {
        try {
            const payload = jwt.verify(token, this.config.secret);
            // Ensure this is an access token
            if (payload.type !== 'access') {
                return null;
            }
            return payload;
        }
        catch {
            return null;
        }
    }
    /**
     * Verify a refresh token and return payload
     * Returns null if token is invalid or expired
     */
    verifyRefreshToken(token) {
        try {
            const payload = jwt.verify(token, this.config.secret);
            // Ensure this is a refresh token
            if (payload.type !== 'refresh') {
                return null;
            }
            return payload;
        }
        catch {
            return null;
        }
    }
    /**
     * Decode a token without verification (for inspection only)
     */
    decode(token) {
        try {
            return jwt.decode(token);
        }
        catch {
            return null;
        }
    }
    /**
     * Generate a unique ID (UUID v4)
     */
    generateId() {
        return uuidv4();
    }
    /**
     * Get the expiry date for a refresh token
     */
    getRefreshExpiryDate() {
        const expiresIn = parseDuration(this.config.refreshTokenExpiry);
        return new Date(Date.now() + expiresIn * 1000);
    }
    /**
     * Get the expiry date for an access token
     */
    getAccessExpiryDate() {
        const expiresIn = parseDuration(this.config.accessTokenExpiry);
        return new Date(Date.now() + expiresIn * 1000);
    }
}
/**
 * Create a singleton JWT Service instance with environment variables
 */
export function createJWTService() {
    return new JWTService({
        secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
        accessTokenExpiry: process.env.JWT_ACCESS_EXPIRES || '15m',
        refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES || '7d',
    });
}
// Singleton instance (lazy-loaded)
let jwtServiceInstance = null;
/**
 * Get or create the singleton JWT Service instance
 */
export function getJWTService() {
    if (!jwtServiceInstance) {
        jwtServiceInstance = createJWTService();
    }
    return jwtServiceInstance;
}
