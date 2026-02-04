/**
 * JWT Token Payload
 * Contains user identity and token metadata
 */
export interface TokenPayload {
    sub: string;
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
    expiresIn: number;
    refreshExpiresIn: number;
}
/**
 * Configuration for JWT Service
 */
export interface JWTConfig {
    secret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
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
export declare class JWTService {
    private config;
    constructor(config: JWTConfig);
    /**
     * Generate access and refresh token pair
     */
    generateTokenPair(userId: string, email: string, isAdmin: boolean): TokenPair;
    /**
     * Verify an access token and return payload
     * Returns null if token is invalid or expired
     */
    verifyAccessToken(token: string): TokenPayload | null;
    /**
     * Verify a refresh token and return payload
     * Returns null if token is invalid or expired
     */
    verifyRefreshToken(token: string): TokenPayload | null;
    /**
     * Decode a token without verification (for inspection only)
     */
    decode(token: string): TokenPayload | null;
    /**
     * Generate a unique ID (UUID v4)
     */
    generateId(): string;
    /**
     * Get the expiry date for a refresh token
     */
    getRefreshExpiryDate(): Date;
    /**
     * Get the expiry date for an access token
     */
    getAccessExpiryDate(): Date;
}
/**
 * Create a singleton JWT Service instance with environment variables
 */
export declare function createJWTService(): JWTService;
/**
 * Get or create the singleton JWT Service instance
 */
export declare function getJWTService(): JWTService;
//# sourceMappingURL=jwt.d.ts.map