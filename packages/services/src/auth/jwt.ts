import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

/**
 * JWT Token Payload
 * Contains user identity and token metadata
 */
export interface TokenPayload {
  sub: string;      // User ID (subject)
  email: string;
  isAdmin: boolean;
  type: 'access' | 'refresh';
}

/**
 * Token Pair Response
 * Contains both access and refresh tokens with expiry information
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;           // Access token expiry in seconds
  refreshExpiresIn: number;     // Refresh token expiry in seconds
}

/**
 * Configuration for JWT Service
 */
export interface JWTConfig {
  secret: string;
  accessTokenExpiry: string;     // e.g., '15m', '1h', '7d'
  refreshTokenExpiry: string;    // e.g., '7d', '30d'
}

/**
 * Parse duration string to seconds
 * Supports: s (seconds), m (minutes), h (hours), d (days)
 * @example
 * parseDuration('15m') => 900
 * parseDuration('7d') => 604800
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // Default 15 minutes

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
  private config: JWTConfig;

  constructor(config: JWTConfig) {
    if (!config.secret) {
      throw new Error('JWT secret is required');
    }
    this.config = config;
  }

  /**
   * Generate access and refresh token pair
   */
  generateTokenPair(userId: string, email: string, isAdmin: boolean): TokenPair {
    const accessExpiresIn = parseDuration(this.config.accessTokenExpiry);
    const refreshExpiresIn = parseDuration(this.config.refreshTokenExpiry);

    const accessToken = jwt.sign(
      { sub: userId, email, isAdmin, type: 'access' } as TokenPayload,
      this.config.secret,
      { expiresIn: accessExpiresIn }
    );

    const refreshToken = jwt.sign(
      { sub: userId, email, isAdmin, type: 'refresh' } as TokenPayload,
      this.config.secret,
      { expiresIn: refreshExpiresIn }
    );

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
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, this.config.secret, { algorithms: ['HS256'] }) as TokenPayload;
      // Ensure this is an access token
      if (payload.type !== 'access') {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Verify a refresh token and return payload
   * Returns null if token is invalid or expired
   */
  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, this.config.secret, { algorithms: ['HS256'] }) as TokenPayload;
      // Ensure this is a refresh token
      if (payload.type !== 'refresh') {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Decode a token without verification (for inspection only)
   */
  decode(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload | null;
    } catch {
      return null;
    }
  }

  /**
   * Generate a unique ID (UUID v4)
   */
  generateId(): string {
    return uuidv4();
  }

  /**
   * Get the expiry date for a refresh token
   */
  getRefreshExpiryDate(): Date {
    const expiresIn = parseDuration(this.config.refreshTokenExpiry);
    return new Date(Date.now() + expiresIn * 1000);
  }

  /**
   * Get the expiry date for an access token
   */
  getAccessExpiryDate(): Date {
    const expiresIn = parseDuration(this.config.accessTokenExpiry);
    return new Date(Date.now() + expiresIn * 1000);
  }
}

/**
 * Create a singleton JWT Service instance with environment variables
 */
export function createJWTService(): JWTService {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return new JWTService({
    secret,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES || '7d',
  });
}

// Singleton instance (lazy-loaded)
let jwtServiceInstance: JWTService | null = null;

/**
 * Get or create the singleton JWT Service instance
 */
export function getJWTService(): JWTService {
  if (!jwtServiceInstance) {
    jwtServiceInstance = createJWTService();
  }
  return jwtServiceInstance;
}
