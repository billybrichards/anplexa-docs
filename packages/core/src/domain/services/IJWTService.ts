/**
 * JWT Service Interface
 *
 * Defines the contract for JWT token generation, verification, and management.
 */

export interface TokenPayload {
  sub: string;
  email: string;
  isAdmin: boolean;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface IJWTService {
  generateTokenPair(userId: string, email: string, isAdmin: boolean): TokenPair;
  verifyAccessToken(token: string): TokenPayload | null;
  verifyRefreshToken(token: string): TokenPayload | null;
  decode(token: string): TokenPayload | null;
  generateId(): string;
  getRefreshExpiryDate(): Date;
  getAccessExpiryDate(): Date;
}
