"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
exports.createJWTService = createJWTService;
exports.getJWTService = getJWTService;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
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
class JWTService {
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
        const accessToken = jsonwebtoken_1.default.sign({ sub: userId, email, isAdmin, type: 'access' }, this.config.secret, { expiresIn: accessExpiresIn });
        const refreshToken = jsonwebtoken_1.default.sign({ sub: userId, email, isAdmin, type: 'refresh' }, this.config.secret, { expiresIn: refreshExpiresIn });
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
            const payload = jsonwebtoken_1.default.verify(token, this.config.secret);
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
            const payload = jsonwebtoken_1.default.verify(token, this.config.secret);
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
            return jsonwebtoken_1.default.decode(token);
        }
        catch {
            return null;
        }
    }
    /**
     * Generate a unique ID (UUID v4)
     */
    generateId() {
        return (0, uuid_1.v4)();
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
exports.JWTService = JWTService;
/**
 * Create a singleton JWT Service instance with environment variables
 */
function createJWTService() {
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
function getJWTService() {
    if (!jwtServiceInstance) {
        jwtServiceInstance = createJWTService();
    }
    return jwtServiceInstance;
}
